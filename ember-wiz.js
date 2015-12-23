function require(module) {
  return new Ember.RSVP.Promise(function (resolve, reject) {
    System.import(module).then(resolve).catch(reject);
  });
}

function loadRoute(target) {
  var Promise = Ember.RSVP.Promise;
  var self = this;
  var options = this.EMBER_WIZ || {};

  return new Promise(function (resolve, reject) {
    var nodes = target.split('.');

    if (nodes.length) {
      var router = self.get('__container__').lookup('router:main');
      var container = router.container;
      var cache = container.cache;
      var registry = container.registry;
      var missing = [];
      var paths = [];
      var pod_dir = options.POD_DIR || "pod/";

      nodes.forEach((v, i)=> {
        if (v.length) {
          paths.push(nodes.slice(0, i + 1).join("/"));
        }
      });

      paths.forEach((v, i)=> {
        var nodes = v.split("/");
        var baseName = nodes.join("-");
        var routeName = nodes.join(".");
        var factoryName = baseName.classify();
        var fullName = baseName.camelize();

        if (!(cache['route:' + fullName] && cache['route:' + fullName]["$wiz"])) {
          missing.push(Promise.all([
            self.require(pod_dir + v + '/route'),
            self.require(pod_dir + v + '/controller'),
            self.require(pod_dir + v + '/template.hbs!')
          ]).then(function (modules) {
            var routeInstance;

            Ember.TEMPLATES[v] = modules[2];

            registry.register('controller:' + fullName, App[factoryName + 'Controller'] || modules[1]);

            registry.unregister('route:' + fullName);
            container.reset('route:' + fullName);
            registry.register('route:' + fullName, App[factoryName + 'Route'] || modules[0]);

            routeInstance = container.lookup('route:' + fullName);
            routeInstance.set('routeName', routeName);
            routeInstance.set('$wiz', true);
          }));
        }
      });

      Promise.all(missing).then(resolve);
    }
    else {
      resolve();
    }
  });
}

var Router = Ember.Router.extend({
  startRouting (moduleBasedResolver) {
    var application = this.get('application');
    var initialURL = this.get('initialURL');

    if (this.setupRouter(moduleBasedResolver)) {
      if (typeof initialURL === "undefined") {
        initialURL = this.get('location').getURL();
      }

      var recognizer = this.router.recognizer;
      var recognize = recognizer.recognize.bind(recognizer);
      var handlers = recognize(initialURL);
      var target = handlers[handlers.length - 1].handler;
      var self = this;

      Ember.RSVP.Promise.all([
        application.loadRoute('application'),
        application.loadRoute(target)
      ]).then(function () {
        var initialTransition = self.handleURL(initialURL);

        if (initialTransition && initialTransition.error) {
          throw initialTransition.error;
        }
      });
    }
  }
});

var Routing = Ember.__loader.require('ember-routing/services/routing').default.extend({
  transitionTo (routeName, models, queryParams, shouldReplace) {
    var self = this;
    var _super = this._super;
    var superArgs = arguments;

    this.get('application').loadRoute(routeName).then(function () {
      _super.apply(self, superArgs);
    });
  }
});

export default function (application) {
  application.require = require;
  application.loadRoute = loadRoute.bind(application);
  application.Router = Router.extend({application});
  application.RoutingService = Routing.extend({application});
  application.inject('route', 'routing', 'service:Routing');
  application.inject('controller', 'routing', 'service:Routing');
};
