<?php
    namespace Glowie\Plugins\Reactables;

    use Util;
    use Glowie\Core\Plugin;
    use Glowie\Core\Http\Rails;
    use Glowie\Core\View\Skeltch;
    use Glowie\Core\CLI\Firefly;
    use Glowie\Plugins\Reactables\Commands\CreateComponent;
    use Glowie\Plugins\Reactables\Commands\DeleteTempUploads;
    use Glowie\Plugins\Reactables\Controllers\Component;
    use Glowie\Plugins\Reactables\Exception\ComponentException;
    use Glowie\Plugins\Reactables\Middlewares\ValidateChecksum;
    use Glowie\Plugins\Reactables\Middlewares\DispatchMiddlewares;

    /**
     * Glowie dynamic view components plugin.
     * @category Plugin
     * @package glowieframework/glowie-reactables
     * @author Glowie
     * @copyright Copyright (c) Glowie
     * @license MIT
     * @link https://eugabrielsilva.tk/glowie
     */
    class Reactables extends Plugin{

        /**
         * Initializes the plugin.
         */
        public function register(){
            // Register the AJAX and assets routes
            Rails::groupRoutes('reactables', function(){
                Rails::addProtectedRoute('component', [ValidateChecksum::class, DispatchMiddlewares::class], Component::class, 'component', 'post', 'reactables-component-route');
                Rails::addRoute('assets.js', Component::class, 'assets', [], 'reactables-assets-route');
            }, true);

            // Register the Skeltch directives
            Skeltch::directive('component\s*\((.+?)\)', '<?php \Glowie\Plugins\Reactables\Reactables::renderComponent($1); ?>');
            Skeltch::directive('reactablesAssets', '<?php \Glowie\Plugins\Reactables\Reactables::renderAssets(); ?>');

            // Register the CLI commands
            Firefly::custom('reactables', CreateComponent::class);
            Firefly::custom('reactables', DeleteTempUploads::class);
        }

        /**
         * Renders a component in the view.
         * @param string $component Component name to render.
         * @param array $params (Optional) Associative array of parameters to parse into the component.
         */
        public static function renderComponent(string $component, array $params = []){
            $class = '\Glowie\Controllers\Components\\' . Util::pascalCase($component);
            if(!class_exists($class)) throw new ComponentException('Component "' . $component . '" does not exist');
            $class = new $class;
            $class->initializeComponent();
            $class->fillComponentParams($params);
            if(is_callable([$class, 'create'])) $class->create();
            $class->fillQueryParams();
            $class->make();
        }

        /**
         * Renders the assets scripts in the view.
         */
        public static function renderAssets(){
            echo '<script src="' . Util::baseUrl('reactables/assets.js') . '"></script>';
        }

    }

?>