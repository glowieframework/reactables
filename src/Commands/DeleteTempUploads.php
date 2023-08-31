<?php
    namespace Glowie\Plugins\Reactables\Commands;

    use Glowie\Core\CLI\Command;
    use Glowie\Core\Exception\FileException;
    use Config;
    use Util;

    /**
     * Reactables delete temporary uploads command.
     * @category Command
     * @package glowieframework/reactables
     * @author Glowie
     * @copyright Copyright (c) Glowie
     * @license MIT
     * @link https://eugabrielsilva.tk/glowie
     */
    class DeleteTempUploads extends Command{

        /**
         * The command script.
         */
        public function run(){
            // Get temp directory
            $dir = Config::get('reactables.tmp_path', Util::location('storage/reactables'));
            if(!is_writable($dir)) throw new FileException('Directory "' . $dir . '" is not writable, please check your chmod settings');

            // Delete files
            foreach (Util::getFiles($dir . '/*') as $filename) unlink($filename);

            // Return result
            $this->print('<bg="yellow"><color="black">Reactables</color></bg> ', false);
            $this->success("Temporary uploads deleted successfully!");
        }

    }

?>