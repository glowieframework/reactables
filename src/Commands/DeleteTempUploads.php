<?php
    namespace Glowie\Plugins\Reactables\Commands;

    use Glowie\Core\CLI\Command;
    use Glowie\Plugins\Reactables\Reactables;

    /**
     * Reactables delete temporary uploads command.
     * @category Command
     * @package glowieframework/glowie-reactables
     * @author Glowie
     * @copyright Copyright (c) Glowie
     * @license MIT
     * @link https://glowie.tk
     */
    class DeleteTempUploads extends Command{

        /**
         * The command script.
         */
        public function run(){
            Reactables::deleteTempUploads();
            $this->success("Temporary uploads deleted successfully!");
        }

    }

?>