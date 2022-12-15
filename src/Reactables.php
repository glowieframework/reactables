<?php
    namespace Glowie\Plugins\Reactables;

    use Glowie\Core\Plugin;
    use Glowie\Core\Http\Rails;
    use Glowie\Core\View\Skeltch;
    use Glowie\Core\Exception\ConsoleException;
    use Glowie\Core\Exception\FileException;
    use Glowie\Plugins\Reactables\Controllers\Component;
    use Glowie\Plugins\Reactables\Middlewares\ValidateChecksum;
    use Util;

    class Reactables extends Plugin{

        /**
         * Array of files to be published to the app folder.
         * @var array
         */
        protected $files = [
            __DIR__ . '/Commands/CreateComponent.php' => 'commands/CreateComponent.php'
        ];

        /**
         * Initializes the plugin.
         */
        public function register(){
            // Register the AJAX and assets routes
            Rails::addProtectedRoute('reactables/component', ValidateChecksum::class, Component::class, 'component', 'post');
            Rails::addRoute('reactables/assets', Component::class, 'assets');

            // Register the Skeltch directives
            Skeltch::directive('component\s*\((.+?)\)', '<?php \Glowie\Plugins\Reactables\Reactables::renderComponent($1) ?>');
            Skeltch::directive('reactablesAssets', '<?php \Glowie\Plugins\Reactables\Reactables::renderAssets() ?>');
        }

        /**
         * Renders a component in the view.
         * @param string $component Component name to render.
         * @param array $params (Optional) Associative array of parameters to parse into the component.
         */
        public static function renderComponent(string $component, array $params = []){
            $class = '\Glowie\Controllers\Components\\' . Util::pascalCase($component);
            if(!class_exists($class)) throw new FileException('[Reactables] Component "' . $component . '" does not exist');
            $class = new $class;
            $class->initializeComponent();
            if(is_callable([$class, 'create'])) $class->create();
            $class->fillComponentParams($params);
            $class->make();
        }

        /**
         * Renders the assets scripts in the view.
         * @param bool $jquery (Optional) Include jQuery script.
         */
        public static function renderAssets(bool $jquery = true){
            if($jquery) $assets = '<script src="' . Util::baseUrl('reactables/assets') . '"></script>';
            echo $assets;
        }

        /**
         * Handler for `create-component` Firefly command.
         * @param string $name Component name.
         * @param array $args Firefly args.
         */
        public static function createComponent(string $name, array $args){
            // Validates the component name
            if(empty($name)) throw new ConsoleException('create-component', $args, 'Missing required argument "name" for this command');

            // Checks if the component exists
            $classname = Util::pascalCase($name);
            $viewname = Util::snakeCase($name);
            $targetFile = Util::location('controllers/Components/' . $classname . '.php');
            if(file_exists($targetFile)) throw new ConsoleException('create-component', $args, "Component {$classname} already exists!");

            // Checks components controllers folder
            if(!is_dir(Util::location('controllers/Components'))) mkdir(Util::location('controllers/Components'), 0755, true);
            if(!is_writable(Util::location('controllers/Components'))) throw new FileException('Directory "app/controllers/Components" is not writable, please check your chmod settings');

            // Creates the controller file
            $template = file_get_contents(__DIR__ . '/Templates/Controller.php');
            $template = str_replace('__FIREFLY_TEMPLATE_NAME__', $classname, $template);
            $template = str_replace('__FIREFLY_TEMPLATE_VIEW__', $viewname, $template);
            file_put_contents($targetFile, $template);

            // Checks components view folder
            if(!is_dir(Util::location('views/components'))) mkdir(Util::location('views/components'), 0755, true);
            if(!is_writable(Util::location('views/components'))) throw new FileException('Directory "app/views/components" is not writable, please check your chmod settings');

            // Creates the view file
            $targetFile = Util::location('views/components/' . $viewname . '.phtml');
            file_put_contents($targetFile, '{# Create your component view here #}');
        }

    }

?>