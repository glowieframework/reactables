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
            $data = $this->request->getJson();
            if(empty($data->id)) return;

            // Instantiate component class
            $name = Util::pascalCase(Util::decryptString($data->id) ?? '');
            if(empty($name)) throw new ComponentException('Invalid component identifier');
            $class = '\Glowie\Controllers\Components\\' . $name;
            if(!class_exists($class)) throw new ComponentException('Component "' . $name . '" does not exist');
            $class = new $class;

            // Initialize component data
            $class->initializeComponent();
            $class->fillComponentParams($data->data);

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
                    . file_get_contents(__DIR__ . '/../Assets/morphdom.min.js')
                    . file_get_contents(__DIR__ . '/../Assets/reactables.min.js');
            $this->response->setBody($scripts);
        }

    }

?>