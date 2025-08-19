<?php

namespace Glowie\Plugins\Reactables\Controllers;

use Glowie\Core\Element;
use Glowie\Core\Traits\ElementTrait;
use Glowie\Core\Collection;
use DateTime;
use stdClass;
use Util;

/**
 * Reactables serializable Element instance.
 * @category Controller
 * @package glowieframework/reactables
 * @author Glowie
 * @copyright Copyright (c) Glowie
 * @license MIT
 * @link https://glowie.gabrielsilva.dev.br/reactables
 */
class ExtendedElement extends Element
{

    /**
     * Object hash property name.
     * @var string
     */
    const PROP_NAME = '$$_objHash';

    /**
     * Sets the value for a key in the Element data.
     * @param string|array $key Key to set value (accepts dot notation keys). You can also pass an associative array\
     * of values to set at once and they will be merged into the Element data.
     * @param mixed $value (Optional) Value to set.
     * @param bool $ignoreDot (Optional) Ignore dot notation keys.
     * @param bool $invokeTypes (Optional) Invoke property types from request.
     * @return Element Current Element instance for nested calls.
     */
    public function set($key, $value = null, bool $ignoreDot = false, bool $invokeTypes = false)
    {
        // Check for an array of parameters
        if (is_array($key)) {
            foreach ($key as $k => $v) {
                $this->set($k, $v, $ignoreDot, $invokeTypes);
            }
            return $this;
        }

        // Invoke object types
        if ($invokeTypes) $value = $this->invokeRecursive($value);

        // Call default set method
        return Element::set($key, $value, $ignoreDot);
    }

    /**
     * Gets the Element data as JSON.
     * @param int $flags (Optional) JSON encoding flags (same as in `json_encode()` function).
     * @param int $depth (Optional) JSON encoding maximum depth (same as in `json_encode()` function).
     * @param bool $setTypes (Optional) Set property types to request.
     * @return string The resulting JSON string.
     */
    public function toJson(int $flags = JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_NUMERIC_CHECK, int $depth = 512, bool $setTypes = false)
    {
        $data = $this->toArray();
        if ($setTypes) $data = $this->iterateRecursive($data);
        return empty($data) ? '{}' : json_encode($data, $flags, $depth);
    }

    /**
     * Iterates recursively over each object property to set hashes.
     * @param array $data Property to iterate.
     * @return array Returns the hashed properties.
     */
    private function iterateRecursive(array $data)
    {
        foreach ($data as $key => $value) {
            if ($this->isElementLike($value) || $value instanceof Collection) {
                $data[$key] = $this->iterateRecursive($value->toArray());
            } else if ($value instanceof MutableObject) {
                $data[$key] = $this->iterateRecursive($value->mutate());
            } else if (is_array($value)) {
                $data[$key] = $this->iterateRecursive($value);
            } else if ($value instanceof stdClass) {
                $data[$key] = $this->iterateRecursive((array)$value);
            }

            $data[$key] = $this->setPropertyType($value);
        }

        return $data;
    }

    /**
     * Sets a property type to hash.
     * @param mixed $value Property value.
     */
    private function setPropertyType($value)
    {
        if ($this->isElementLike($value) || $value instanceof Collection) {
            $value->set(self::PROP_NAME, Util::encryptString(get_class($value)));
        } else if ($value instanceof MutableObject) {
            $originalObject = $value;
            $value = $value->mutate();
            if (!isset($value[self::PROP_NAME])) $value[self::PROP_NAME] = Util::encryptString(get_class($originalObject));
        } else if ($value instanceof DateTime || $value instanceof stdClass) {
            $originalObject = $value;
            $value = (array)$value;
            if (!isset($value[self::PROP_NAME])) $value[self::PROP_NAME] = Util::encryptString(get_class($originalObject));
        }

        return $value;
    }

    /**
     * Checks if variable is an Element-like.
     * @param mixed $value Variable to check.
     * @return bool Returns true or false.
     */
    private function isElementLike($value)
    {
        return is_object($value) && Util::usesTrait($value, ElementTrait::class);
    }

    /**
     * Invokes properties recursively.
     * @param mixed $value Property to invoke.
     * @return mixed Returns the new property.
     */
    private function invokeRecursive($value)
    {
        if (is_object($value)) {
            foreach ($value as $k => $v) {
                $value->{$k} = $this->invokeRecursive($v);
            }
        } else if (is_array($value)) {
            foreach ($value as $k => $v) {
                $value[$k] = $this->invokeRecursive($v);
            }
        }

        return $this->invokePropertyType($value);
    }

    /**
     * Invokes a property type from hash.
     * @param mixed $value Property value.
     * @return mixed Returns the value.
     */
    private function invokePropertyType($value)
    {
        // Checks for hashed object
        if (is_object($value) && isset($value->{self::PROP_NAME})) {
            // Get objHash classname
            $class = Util::decryptString($value->{self::PROP_NAME});

            // Instantiate object
            if ($class && class_exists($class)) {
                $newValue = new $class();

                // Remove objHash property from object
                unset($value->{self::PROP_NAME});

                // Parse properties
                if ($this->isElementLike($newValue) || $newValue instanceof Collection) $newValue->set((array)$value);
                if ($newValue instanceof MutableObject) $newValue->restore((array)$value);
                if ($newValue instanceof DateTime) $newValue = $newValue->__set_state((array)$value);
                if ($newValue instanceof stdClass) $newValue = (object)$value;

                // Return new instance
                $value = $newValue;
            }
        } else if (is_array($value) && isset($value[self::PROP_NAME])) {
            // Checks for hashed array
            $class = Util::decryptString($value[self::PROP_NAME]);

            // Instantiate object
            if ($class && class_exists($class)) {
                $newValue = new $class();

                // Remove objHash property from array
                unset($value[self::PROP_NAME]);

                // Parse properties
                if ($this->isElementLike($newValue) || $newValue instanceof Collection) $newValue->set((array)$value);

                // Return new instance
                $value = $newValue;
            }
        }

        // Returns the value
        return $value;
    }
}
