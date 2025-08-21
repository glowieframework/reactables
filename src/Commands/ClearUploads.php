<?php

namespace Glowie\Plugins\Reactables\Commands;

use Glowie\Core\CLI\Command;
use Glowie\Core\Exception\FileException;
use Config;
use Util;

/**
 * Reactables clear temporary uploads Firefly command.
 * @category Command
 * @example Usage: `reactables:clear-uploads`
 * @package glowieframework/reactables
 * @author Glowie
 * @copyright Copyright (c) Glowie
 * @license MIT
 * @link https://glowie.gabrielsilva.dev.br/reactables
 */
class ClearUploads extends Command
{

    /**
     * The command script.
     */
    public function run()
    {
        // Print title
        $this->print('<bg="yellow"><color="black">Reactables</color></bg> ', false);

        // Get temp directory
        $dir = rtrim(Config::get('reactables.uploads.tmp_path', Util::location('storage/reactables')), '/\\');
        if (!is_writable($dir)) throw new FileException('Directory "' . $dir . '" is not writable, please check your chmod settings');

        // Delete files
        if ($this->confirm('<color="yellow">Clear temporary uploads?</color>')) {
            foreach (Util::getFiles($dir . '/*.tmp') as $filename) {
                unlink($filename);
            }
            $this->success("Temporary uploads deleted successfully!");
        }
    }
}
