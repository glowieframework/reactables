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
         * Handles the component update AJAX route.
         */
        public function component(){
            // Get request data
            $data = $this->post;
            if(empty($data->name)) return;

            // Instantiate component class
            $name = Util::pascalCase($data->name);
            $class = '\Glowie\Controllers\Components\\' . $name;
            if(!class_exists($class)) throw new ComponentException('Component "' . $name . '" does not exist');
            $class = new $class;

            // Initialize component data
            $class->initializeComponent();
            if(!empty($data->id)) $class->setComponentId($data->id);
            if(!empty($data->data)) $class->fillComponentParams((array)json_decode($data->data));

            // Handle uploads
            if(!empty($_FILES)) $class->handleUploads();

            // Call update method
            if(is_callable([$class, 'update'])) $class->update();

            // Check method call
            if(!empty($data->method)){
                // Check magic actions
                if($data->method == '$refresh()'){
                    // Do nothing, refresh the component only
                }else if(Util::startsWith($data->method, '$set(')){
                    $class->magicSet($data->method);
                }else if(Util::startsWith($data->method, '$toggle(')){
                    $class->magicToggle($data->method);
                }else{
                    eval('$class->' . $data->method . ';');
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
                'query' => $class->buildQueryString(),
                'data' => $class->getComponentData(),
                'events' => $class->getDispatchedEvents()
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