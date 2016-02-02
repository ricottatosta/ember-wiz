# Ember Wiz

AMD module for lazy loading of Ember routes.
Works with [SystemJS](https://github.com/systemjs/systemjs), only for routes organized in POD as follow:

route mapping

    [application:main].Router.map(function() {
      this.route('posts', function() {
        this.route('post');
      });
    });

directory schema

    config.js
    jspm_packages
    pod
      |-application
        |-controller.js
        |-route.js
        |-template.(hbs|js)
      |-index
        |-controller.js
        |-route.js
        |-template.(hbs|js)
      |-posts
        |-index
          |-controller.js
          |-route.js
          |-template.(hbs|js)
        |-post
          |-controller.js
          |-route.js
          |-template.(hbs|js)
        |-controller.js
        |-route.js
        |-template.(hbs|js)

Not tested with ember-cli yet.

## Requirements

- [jspm](http://jspm.io);
- [ember](https://github.com/components/ember) >= 2.0.0;
- [hbs](https://github.com/n-fuse/plugin-ember-hbs) >= 2.0.0.

## Installation

    jspm install ember-wiz

## Usage

    System.import('ember-wiz').then(function(module) {
      var init = module.default;
        
      var App = Ember.Application.extend({
        "EMBER_WIZ": {
          "POD_DIR": your_pod_dir, // default: "pods/",
          "COMPILED_HBS": false // if templates are pre-compiled, set to true
        }
      });
        
      App.deferReadiness();
      init(App);
      ...
      App.Router.map(...);
      ...
      App.advanceReadiness();
    });

## How does it work

It is an AMD module following ES6 module behavior. It will be exported as follow:

`{"default": decorator, "Router": Router, "RoutingService": RoutingService};`

It can be used as decorator:

`module.default(applicationInstance);`

or extending each component:

`[application:main].Router = module.Router.extend();`

`[application:main].RoutingService = module.RoutingService.extend();`

## Key components

`[router:main].loadRoute(target)`

Used to preload and register factories and to cache factory instances. It preloads route, controller and template files of any route in the target not loaded yet, `route:application`  included. Returns an Ember Promise.

`[router:main].startRouting()`

Overridden to implement lazy loading at initial URL.

`[service:Routing].transitionTo()`

Overridden to implement lazy loading at transition time, either by `linkTo` component or by using it in actions.

`[RouteInstance].routing.transitionTo()`

`[ControllerInstance].routing.transitionTo()`

If used as decorator, modified RoutingService is injected into routes and controllers as `routing` property to ease route transition by actions.

Be aware: only methods using `routing.transitionTo` will be able to lazily load routes!

## To Do

- ember-cli integration (if possible).
