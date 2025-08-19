<?php

namespace Glowie\Plugins\Reactables\Controllers;

/**
 * MutableObject interface for Reactables objects.
 * @category Interface
 * @package glowieframework/reactables
 * @author Glowie
 * @copyright Copyright (c) Glowie
 * @license MIT
 * @link https://glowie.gabrielsilva.dev.br/reactables
 */
interface MutableObject
{

    /**
     * Returns the class data to be stored in the JSON object.
     * @return array Should return an associative array with the data you need.
     */
    public function mutate();

    /**
     * Receives the JSON object stored data back to the class.
     * @param array $data Associative array with the previously serialized data.
     * @return void
     */
    public function restore(array $data);
}
