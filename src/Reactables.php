<?php

namespace Glowie\Plugins\Reactables;

use Util;
use Glowie\Core\Plugin;
use Glowie\Core\Http\Rails;
use Glowie\Core\View\Skeltch;
use Glowie\Core\CLI\Firefly;
use Glowie\Plugins\Reactables\Commands\Create;
use Glowie\Plugins\Reactables\Commands\DeleteTempUploads;
use Glowie\Plugins\Reactables\Exception\ComponentException;
use Glowie\Plugins\Reactables\Middlewares\ValidateChecksum;
use Glowie\Plugins\Reactables\Middlewares\DispatchMiddlewares;
use Glowie\Plugins\Reactables\Controllers\Main;

/**
 * Glowie dynamic view components plugin.
 * @category Plugin
 * @package glowieframework/reactables
 * @author Glowie
 * @copyright Copyright (c) Glowie
 * @license MIT
 * @link https://glowie.gabrielsilva.dev.br/reactables
 */
class Reactables extends Plugin
{

    /**
     * Initializes the plugin.
     */
    public function register()
    {
        // Register the AJAX and assets routes
        Rails::groupRoutes('reactables', function () {
            Rails::addProtectedRoute('update', [ValidateChecksum::class, DispatchMiddlewares::class], Main::class, 'update', 'post', 'reactables-component-route');
            Rails::addRoute('assets.min.js', Main::class, 'assets', 'get', 'reactables-assets-route');
        }, true);

        // Register the Skeltch directives
        Skeltch::directive('component\s*\((.+?)\)', '<?php \Glowie\Plugins\Reactables\Reactables::renderComponent($1); ?>');
        Skeltch::directive('reactablesAssets', '<?php \Glowie\Plugins\Reactables\Reactables::renderAssets(); ?>');

        // Register the CLI commands
        Firefly::custom('reactables', Create::class);
        Firefly::custom('reactables', DeleteTempUploads::class);
    }

    /**
     * Checks if the request was made using Reactables by checking the `X-Reactables` header.
     * @return bool Returns true or false for the Reactables request.
     */
    public static function isReactablesRequest()
    {
        return Rails::getRequest()->hasHeader('X-Reactables');
    }

    /**
     * Instructs a full page reload/redirect from `r-navigate` calls.
     * @param string|null $url (Optional) Target URL. Leave blank to use the current requested URL.
     */
    public static function redirectNavigate(?string $url = null)
    {
        if (is_null($url)) $url = Rails::getRequest()->getPreviousUrl();
        Rails::getResponse()->setHeader('X-Reactables-Redirect', $url);
    }

    /**
     * Renders a component in the view.
     * @param string $component Component name to render.
     * @param array $params (Optional) Associative array of parameters to parse into the component.
     */
    public static function renderComponent(string $component, array $params = [])
    {
        // Find component class
        $class = '\Glowie\Controllers\Components\\' . Util::pascalCase($component);
        if (!class_exists($class)) throw new ComponentException('Component "' . $component . '" does not exist');

        // Create and initialize class
        $class = new $class;
        $class->initializeComponent(true);

        // Run create() and fill initial parameters
        if (is_callable([$class, 'create'])) $class->create();
        $class->fillComponentData($params);

        // Fill query and call make() method
        $class->fillQueryParams();
        $class->make();
    }

    /**
     * Renders the assets scripts in the view.
     */
    public static function renderAssets()
    {
        echo '<script src="' . Util::baseUrl('reactables/assets.min.js') . '"></script>';
    }
}
