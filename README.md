# Ember Wiz

Lazy loading of Ember routes through SystemJS.
Works only for routes organized in POD, as follow:

route mapping

    [ApplicationInstance].Router.map(function() {
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
        |-router.js
        |-template.hbs
      |-index
        |-controller.js
        |-router.js
        |-template.hbs
      |-posts
        |-index
          |-controller.js
          |-router.js
          |-template.hbs
        |-post
          |-controller.js
          |-router.js
          |-template.hbs
        |-controller.js
        |-router.js
        |-template.hbs

Not tested with ember-cli yet.

## Requirements

- [jspm](http://jspm.io);
- [ember](https://github.com/components/ember);
- [hbs](https://github.com/n-fuse/plugin-ember-hbs).

## Installation

    jspm install git://github.com/ricottatosta/ember-wiz

## Usage

    import Wiz from 'ember-wiz';
    ...
    var EMBER_WIZ = {
      "POD_DIR": your_pod_dir // default: "pod/"
    };
    var App = Ember.Application.create({EMBER_WIZ});
    App.deferReadiness();
    ...
    Wiz(App);
    ...
    App.advanceReadiness();

## Key Components

`[ApplicationInstance].require(module)`

Used to wrap standard Promise (System.import). Returns an Ember Promise.

`[ApplicationInstance].loadRoute(target)`

Used to preload and register factories and to cache factory instances. Returns an Ember Promise.

`[ApplicationInstance].Router.startRouting()`

Overridden to implement lazy loading at initial URL.

`[ApplicationInstance].RoutingService.transitionTo()`

Overridden to implement lazy loading at transition time, either by `linkTo` component or by using it in actions.
Modified RoutingService will be injected into routes and controllers as `routing` property to ease route transition by actions.

Be awared: only methods using `RoutingService.transitionTo` will be able to lazily load routes!

## To Do

- ember-cli integration.