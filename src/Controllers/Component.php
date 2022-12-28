<?php
    namespace Glowie\Plugins\Reactables\Controllers;

    use Glowie\Core\Http\Controller;
    use Glowie\Core\View\Buffer;
    use Glowie\Plugins\Reactables\Exception\ComponentException;
    use Util;

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
            $data = $this->post;
            if(empty($data->id)) return;

            // Instantiate component class
            $name = Util::pascalCase(Util::decryptString($data->id) ?? '');
            if(empty($name)) throw new ComponentException('Invalid component identifier');
            $class = '\Glowie\Controllers\Components\\' . $name;
            if(!class_exists($class)) throw new ComponentException('Component "' . $name . '" does not exist');
            $class = new $class;

            // Initialize component data
            $class->initializeComponent();
            $class->fillComponentParams(json_decode($data->data, true));

            // Call update method
            if(is_callable([$class, 'update'])) $class->update();

            // Check method call
            if($data->type == 'method' && !empty($data->extra)){
                $method = $data->extra;

                // Check magic actions
                if($method == '$refresh()'){
                    // Do nothing, refresh the component only
                }else if(Util::startsWith($method, '$set(')){
                    $class->magicSet($method);
                }else if(Util::startsWith($method, '$toggle(')){
                    $class->magicToggle($method);
                }else{
                    eval('$class->' . $method . ';');
                }
            }

            // Check for redirect instruction
            if($class->getRedirectTarget()) return $this->response->setJson(['redirect' => $class->getRedirectTarget()]);

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
            $this->response->setContentType('text/javascript');
            echo file_get_contents(__DIR__ . '/../Assets/morphdom.min.js') . file_get_contents(__DIR__ . '/../Assets/reactables.min.js');;
        }

    }

?>