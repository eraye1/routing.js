funcs.scope = {
  create: {
    key: function ($scope, key) {
      var immutable = funcs.util.immutable;

      if (!$scope[key]) {
        $scope[key] = {};

        immutable($scope[key], "data", {});
        immutable($scope[key], "self", []);
        immutable($scope[key], "each", function (callback) {
          var arr = $scope[key].self || [];
          arr.forEach(function (o, i) {
            callback(o, i, $scope[key].self);
          });
        });
      }
    },

    // create a new scope property.
    scope: function (meta, $scope, routes) {
      var immutable = funcs.util.immutable,
          self = this;

      // make `event` in $scope immutable as well as `add` inside of
      // $scope.event. Also add `data` inside $scope for random user data.
      // create $scope level data object for storing state data.
      immutable($scope, "data", {});

      // safe retrieval of a property that creates it if it doesn't exist.
      immutable($scope, "get", function (property) {
        if ($scope[property]) return $scope[property];

        funcs.scope.create.key($scope, property);

        console.warn("Error. This property with name '" + property + "' doesn't exist yet.");

        return $scope[property];
      });

      // create event object for adding event functions.
      immutable($scope, "event", {});

      funcs.scope.repeat($scope);

      // create the $scope.event.add function to add custom events.
      immutable($scope.event, "add",
        (function (property, event, callback) {
          // if the property doesn't exist, create a new wrapper object.
          if (!this[property]) this[property] = {};

          // if the event is an object, it's an iterable with multiple events.
          if (typeof event == "object") {
            // so run through it and take the key as the event and the value
            // as the callback.
            for (var x in event) {
              this[property][x] = event[x];
            }
          } else {
            // otherwise just set the event [key] to the callback [value].
            this[property][event] = callback;
          }
          // make thisArg the current state.
        }).bind($scope)
      );

      // creation of a native data object that is bound to the $scope.
      immutable($scope.data, "prop", function (property, key, value) {
        if (!$scope[property]) {
          funcs.scope.create.key($scope, property);
          console.warn("The property with name '" + property + "' doesn't exist yet, but was just created.");
        }

        $scope[property].data[key] = value;

        return $scope[property].data[key];
      });

      immutable($scope.data, "transfer", function (view, key) {
        var data = $scope.data[key];

        if (typeof data == "undefined" || data === null)
          throw "Error. Data associated with key '" + key + "' does not exist.";
        if (meta.routes[view]) {
          meta.routes[view].state.data[key] = data;
        } else throw "Error. View with the name '" + name + "' does not exist.";
      });

      immutable($scope.data, "repeat", {});

      funcs.scope.toolkit($scope);
    }
  },

  removeAllNodeRefs: function ($scope) {
    for (var x in $scope) {
      if ($scope[x].self) {
        funcs.util.tempUnlock($scope[x], "self", function (obj) {
          obj.self = [];
        });
      }
    }

    return $scope;
  }
};

/*
Create $scope.repeat({{name}}) which returns an object that you can push, pop, etc.
This is stored in $scope.data.repeat[name] and is *locked down*.

The $scope.data.repeat[name] is an object like:

{
  container: <NODE>,
  list: []
}

Where the container is cloned and the list is modified.
*/
