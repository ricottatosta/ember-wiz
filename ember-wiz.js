/*
 * @overview  Ember Wiz - Lazy loading of Ember routes through SystemJS
 * @copyright Copyright 2015-2016 ProgHettoLab, an Integrated Planning Workshop
 * @license   Licensed under MIT license
 * @version   0.1.2
 *
 */

define([
    'ember'
], function () {
    function init(application) {
        application.Router = Router.extend({"EMBER_WIZ": application.EMBER_WIZ});
        application.RoutingService = Routing.extend();
        application.inject('route', 'routing', 'service:Routing');
        application.inject('controller', 'routing', 'service:Routing');
    }

    var Router = Ember.Router.extend({
        loadRoute (target) {
            var self = this;
            var options = this.EMBER_WIZ || {};
            var pod_dir = options.POD_DIR || "pods/";
            var handlers = self.get('router.recognizer.names')[target].handlers;
            var application = self.get('namespace');
            var owner = Ember.getOwner(self);
            var container = owner.__container__;
            var cache = container.cache;
            var registry = container.registry;
            var missing = [];

            return new Promise(function (resolve) {
                handlers.forEach((handler)=> {
                    var routeName = handler.handler;
                    var path = routeName.replace(/(\.)/g, "/");
                    var baseName = routeName.replace(/(\.)/g, "-");
                    var factoryName = baseName.classify();
                    var fullName = baseName.camelize();

                    if (!(cache['route:' + fullName] && cache['route:' + fullName]["$wiz"])) {
                        //application[factoryName + 'LoadingRoute'] = application.LoadingRoute.extend();
                        //application[factoryName + 'LoadingController'] = application.LoadingController.extend();
                        //Ember.TEMPLATES[path + '/loading'] = Ember.TEMPLATES['loading'];
                        //
                        //application[factoryName + 'ErrorRoute'] = application.ErrorRoute.extend();
                        //application[factoryName + 'ErrorController'] = application.ErrorController.extend();
                        //Ember.TEMPLATES[path + '/error'] = Ember.TEMPLATES['error'];

                        missing.push(
                            Promise.all([
                                    pod_dir + path + '/route',
                                    pod_dir + path + '/controller',
                                    pod_dir + path + '/template' + (options.COMPILED_HBS ? "" : ".hbs!")
                                ].map((module)=> System.import(module))
                            ).then(function (modules) {
                                var _route = modules[0].default;
                                var _controller = modules[1].default;
                                var _template = modules[2];

                                var routeInstance;

                                if (!options.COMPILED_HBS) Ember.TEMPLATES[path] = _template;

                                registry.register('controller:' + fullName, application[factoryName + 'Controller'] || _controller);

                                registry.unregister('route:' + fullName);
                                container.reset('route:' + fullName);
                                registry.register('route:' + fullName, application[factoryName + 'Route'] || _route);

                                routeInstance = container.lookup('route:' + fullName);
                                routeInstance.set('routeName', routeName);
                                routeInstance.set('$wiz', true);
                            })
                        );
                    }
                });

                Promise.all(missing).then(resolve);
            });
        },
        startRouting (moduleBasedResolver) {
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

                this.loadRoute(target).then(function () {
                    var initialTransition = self.handleURL(initialURL);

                    if (initialTransition && initialTransition.error) {
                        throw initialTransition.error;
                    }
                });
            }
        }
    });

    var RoutingService = Ember.__loader.require('ember-routing/services/routing').default.extend({
        transitionTo (routeName, models, queryParams, shouldReplace) {
            var self = this;
            var _super = this._super;
            var superArgs = arguments;

            this.get('router').loadRoute(routeName).then(function () {
                _super.apply(self, superArgs);
            });
        }
    });

    return {
        "default": init,
        Router,
        RoutingService
    };
});
