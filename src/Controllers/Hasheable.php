<?php

namespace Glowie\Plugins\Reactables\Controllers;

/**
 * Hasheable interface for Reactables objects.
 * @category Interface
 * @package glowieframework/reactables
 * @author Glowie
 * @copyright Copyright (c) Glowie
 * @license MIT
 * @link https://glowie.gabrielsilva.dev.br/reactables
 */
interface Hasheable
{

    /**
     * Returns the class data to be stored in the JSON object.
     * @return array Should return an associative array with the data you need.
     */
    public function __serialize(): array;

    /**
     * Receives the JSON object stored data back to the class.
     * @param array $data Associative array with the previously serialized data.
     */
    public function __unserialize(array $data): void;
}
