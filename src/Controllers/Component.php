<?php
    namespace Glowie\Plugins\Reactables\Controllers;

    use Glowie\Core\Http\Controller;
    use Glowie\Core\View\Buffer;
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

            // Instantiate component class
            $class = '\Glowie\Controllers\Components\\' . Util::pascalCase(Util::decryptString($data->id));
            $class = new $class;

            // Initialize component data
            $class->setRefresh();
            $class->initializeComponent();
            $class->fillComponentParams($data->data);

            // Check method call
            if($data->type == 'method' && !empty($data->extra)){
                $method = $data->extra;
                eval('$class->' . $method . ';');
            }

            // Refresh component
            Buffer::start();
            $class->make();
            $html = Buffer::get();

            // Return response
            $this->response->setJson([
                'status' => true,
                'html' => $html,
                'data' => $class->getComponentData()
            ]);
        }

    }

?>