<?php
    namespace Glowie\Plugins\Reactables\Exception;

    use Exception;
    use Throwable;

    /**
     * Reactables component exception handler.
     * @category Exception
     * @package glowieframework/glowie-reactables
     * @author Glowie
     * @copyright Copyright (c) Glowie
     * @license MIT
     * @link https://glowie.tk
     */
    class ComponentException extends Exception{

        /**
         * Creates a new instance of ComponentException.
         * @param string $message (Optional) The exception message.
         * @param int $code (Optional) The exception code.
         * @param Throwable|null $previous (Optional) Previous throwable used for exception chaining.
         */
        public function __construct(string $message = "", int $code = 0, ?Throwable $previous = null){
            parent::__construct('[Reactables] ' . $message, $code, $previous);
        }

    }

?>