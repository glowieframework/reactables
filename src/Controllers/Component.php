<?php
    namespace Glowie\Reactables\Controllers;

    use Glowie\Core\Http\Controller;

    class Component extends Controller{

        public function component(){
            $this->renderView('reactables/test');
        }

    }

?>