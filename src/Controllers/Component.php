<?php
    namespace Glowie\Plugins\Reactables\Controllers;

    use Glowie\Core\Http\Controller;
    use Glowie\Core\View\Buffer;
    use Util;
    use Throwable;

    /**
     * Reactables core controller.
     * @category Controller
     * @package glowieframework/glowie-reactables
     * @author Glowie
     * @copyright Copyright (c) Glowie
     * @license MIT
     * @link https://glowie.tk
     */
    class Component extends Controller{

        /**
         * Handles the component AJAX route.
         */
        public function component(){
            // Get request data
            $data = $this->request->getJson();
            if(empty($data->id)) return;

            // Instantiate component class
            $class = '\Glowie\Controllers\Components\\' . Util::pascalCase(Util::decryptString($data->id));
            $class = new $class;

            // Initialize component data
            $class->initializeComponent();
            $class->fillComponentParams($data->data);

            // Check method call
            if($data->type == 'method' && !empty($data->extra)){
                $method = $data->extra;

                // Check magic actions
                if(Util::startsWith($method, '$refresh')){
                    // Do nothing, refresh the component only
                }else if(Util::startsWith($method, '$set')){
                    $class->magicSet($method);
                }else{
                    eval('$class->' . $method . ';');
                }
            }

            // Refresh component
            Buffer::start();
            $class->make();
            $html = Buffer::get();

            // Return response
            $this->response->setJson([
                'html' => $html,
                'data' => $class->getComponentData()
            ]);
        }

        /**
         * Handles the assets loader route.
         */
        public function assets(){
            $scripts = file_get_contents(__DIR__ . '/../Assets/jquery.min.js')
                    . file_get_contents(__DIR__ . '/../Assets/morphdom-umd.min.js')
                    . file_get_contents(__DIR__ . '/../Assets/reactables.js');
            $this->response->setBody($scripts);
        }

    }

?>