<?php
    namespace Glowie\Plugins\Reactables\Middlewares;

    use Glowie\Core\Http\Middleware;
    use Glowie\Core\Http\Rails;
    use Glowie\Core\Exception\RoutingException;
    use Util;

    /**
     * Middleware dispatcher middleware.
     * @category Middleware
     * @package glowieframework/glowie-reactables
     * @author Glowie
     * @copyright Copyright (c) Glowie
     * @license MIT
     * @link https://glowie.tk
     */
    class DispatchMiddlewares extends Middleware{

        /**
         * The middleware handler.
         * @return bool Should return true on success or false on fail.
         */
        public function handle(){
            // Get route from POST
            $route = $this->post->route;
            if(empty($route)) return false;

            // Find existing route
            $route = Util::decryptString($route);
            if($route === false) return false;
            $route = Rails::getRoute($route);
            if(is_null($route)) return false;

            // Extract route middlewares
            if(empty($route['middleware'])) return true;

            // Run each middleware
            foreach($route['middleware'] as $middleware){
                if(!$this->runMiddleware($middleware)) return false;
            }

            // Proceed to the component request
            return true;
        }

        /**
         * Runs a middleware.
         * @param string $middleware Middleware class to run.
         * @return bool Returns if the middleware is successful.
         */
        private function runMiddleware(string $middleware){
            if (!class_exists($middleware)) throw new RoutingException("\"{$middleware}\" was not found");
            $middleware = new $middleware;
            if (is_callable([$middleware, 'init'])) $middleware->init();
            return $middleware->handle();
        }

    }

?>