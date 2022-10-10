<?php
    namespace Glowie\Controllers\Components;

    use Glowie\Plugins\Reactables\Controllers\BaseComponent;

    /**
     * Reactables component controller.
     * @category Controller
     * @package glowieframework/glowie-reactables
     * @author Glowie
     * @copyright Copyright (c) Glowie
     * @license MIT
     * @link https://glowie.tk
     */
    class __FIREFLY_TEMPLATE_NAME__ extends BaseComponent{

        /**
         * Use this method to initialize data when the component is initially created.\
         * This will not be triggered when the component is updated.
         */
        public function create(){
            //
        }

        /**
         * Use this method to set what the component does after it's initialized or updated.\
         * Here is where you should render the component view using `$this->render()` method.
         */
        public function make(){
            $this->render('__FIREFLY_TEMPLATE_VIEW__');
        }

    }

?>