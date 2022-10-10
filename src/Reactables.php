<?php
    namespace Glowie\Reactables;

    use Glowie\Core\Plugin;
    use Glowie\Core\Http\Rails;
    use Glowie\Reactables\Controllers\Component;

    class Reactables extends Plugin{

        /**
         * Array of files to be published to the app folder.
         * @var array
         */
        protected $files = [];

        /**
         * Initializes the plugin.
         */
        public function register(){
            Rails::addRoute('reactables', Component::class, 'component');
        }

    }

?>