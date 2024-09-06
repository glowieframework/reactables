<?php

namespace Glowie\Plugins\Reactables\Commands;

use Glowie\Core\CLI\Command;
use Glowie\Core\Exception\FileException;
use Config;
use Util;

/**
 * Reactables delete temporary uploads Firefly command.\
 * Usage: `reactables:delete-temp-uploads`
 * @category Command
 * @package glowieframework/reactables
 * @author Glowie
 * @copyright Copyright (c) Glowie
 * @license MIT
 * @link https://gabrielsilva.dev.br/glowie/reactables
 */
class DeleteTempUploads extends Command
{

    /**
     * The command script.
     */
    public function run()
    {
        // Print title
        $this->print('<bg="yellow"><color="black">Reactables</color></bg> ', false);

        // Get temp directory
        $dir = Config::get('reactables.tmp_path', Util::location('storage/reactables'));
        if (!is_writable($dir)) throw new FileException('Directory "' . $dir . '" is not writable, please check your chmod settings');

        // Delete files
        if ($this->confirm('<color="yellow">Delete temporary uploads?</color>')) {
            foreach (Util::getFiles($dir . '/*') as $filename) unlink($filename);
            $this->success("Temporary uploads deleted successfully!");
        }
    }
}
