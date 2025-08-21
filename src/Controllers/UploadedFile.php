<?php

namespace Glowie\Plugins\Reactables\Controllers;

use Glowie\Core\Element;
use Glowie\Core\Exception\FileException;
use Util;

/**
 * Reactables uploaded file instance.
 * @category Controller
 * @package glowieframework/reactables
 * @author Glowie
 * @copyright Copyright (c) Glowie
 * @license MIT
 * @link https://glowie.gabrielsilva.dev.br/reactables
 */
class UploadedFile extends Element
{

    /**
     * Previews the uploaded file.
     * @return string|bool Returns the preview as a **base64 string** on success, false on errors.
     */
    public function preview()
    {
        // Checks if the file has been stored already and has a public URL
        if ($this->stored && !empty($this->url)) {
            return $this->url;
        }

        // Checks if the file has been stored already and exists
        if ($this->stored && is_file($this->path)) {
            $content = file_get_contents($this->path);
            return 'data: ' . $this->type . ';base64,' . base64_encode($content);
        }

        // Checks if the temporary file exists
        if (is_file($this->tmp_name)) {
            $content = file_get_contents($this->tmp_name);
            return 'data: ' . $this->type . ';base64,' . base64_encode($content);
        }

        // Return false on errors
        return false;
    }

    /**
     * Stores the uploaded file in a definitive way.
     * @param string $directory (Optional) Target directory to store the file. Must be an existing directory with write permissions,\
     * (absolute path or relative to the **app/public** folder).
     * @param string|null $filename (Optional) Custom filename, leave empty to generate an unique name. **This overwrites existing files!**
     * @return bool Returns true on success, false on errors.
     */
    public function store(string $directory = 'uploads', ?string $filename = null)
    {
        // Checks if the file was already stored
        if ($this->stored) return false;

        // Checks for target folder
        $directory = rtrim($directory, '/\\');
        if (!is_writable($directory)) throw new FileException('Directory "' . $directory . '" is invalid or not writable');

        // Move the temp file to the target folder
        $filename = $this->generateFilename($filename);
        $target = $directory . '/' . $filename;
        $result = rename($this->tmp_name, $target);

        // Checks if the store failed
        if (!$result) return false;

        // Sets the file properties
        $this->stored = true;
        $this->url = $target;
        $this->original_name = $this->name;
        $this->name = $filename;
        $this->path = realpath($target);
        return true;
    }

    /**
     * Discards the uploaded file, deleting it.
     * @return bool Returns true on success or false on failure.
     */
    public function discard()
    {
        // Checks if the file was already stored and exists
        if ($this->stored && is_file($this->path)) {
            return unlink($this->path);
        }

        // Deletes the temporary file if exists
        if (is_file($this->tmp_name)) {
            return unlink($this->tmp_name);
        }

        // Return false on errors
        return false;
    }

    /**
     * Checks if the file is already stored.
     * @return bool True or false if file is stored.
     */
    public function isStored()
    {
        return $this->stored ?? false;
    }

    /**
     * Generates an unique filename.
     * @param string|null $filename (Optional) Custom filename to set.
     * @return string Generated filename.
     */
    private function generateFilename(?string $filename = null)
    {
        if (is_null($filename)) $filename = Util::uniqueToken();
        return $filename . (!empty($this->extension) ? ('.' . $this->extension) : '');
    }
}
