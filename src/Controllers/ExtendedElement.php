<?php
    namespace Glowie\Plugins\Reactables\Controllers;

    use Glowie\Core\Element;
    use Glowie\Core\Traits\ElementTrait;
    use JsonSerializable;
    use Util;

    /**
     * Reactables extended Element instance.
     * @category Controller
     * @package glowieframework/reactables
     * @author Glowie
     * @copyright Copyright (c) Glowie
     * @license MIT
     * @link https://eugabrielsilva.tk/glowie
     */
    class ExtendedElement extends Element implements JsonSerializable{

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
        public function set($key, $value = null, bool $ignoreDot = false, bool $invokeTypes = false){
            // Check for an array of parameters
            if(is_array($key)){
                foreach($key as $k => $v) $this->set($k, $v, $ignoreDot, $invokeTypes);
                return $this;
            }

            // Invoke object types
            if($invokeTypes) $this->invokePropertyType($value);

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
        public function toJson(int $flags = JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_NUMERIC_CHECK, int $depth = 512, bool $setTypes = false){
            $data = $this->toArray();
            if($setTypes) foreach($data as &$value) $this->setPropertyType($value);
            return empty($data) ? '{}' : json_encode($data, $flags, $depth);
        }

        /**
         * Sets a property type to hash.
         * @param mixed $value Property value.
         */
        private function setPropertyType(&$value){
            if(Util::usesTrait($value, ElementTrait::class) && !isset($value->{self::PROP_NAME})){
                return $value->{self::PROP_NAME} = Util::encryptString(get_class($value));
            }
        }

        /**
         * Invokes a property type from hash.
         * @param mixed $value Property value.
         */
        private function invokePropertyType(&$value){
            if(is_object($value) && isset($value->{self::PROP_NAME})){
                $class = Util::decryptString($value->{self::PROP_NAME});

                if($class && class_exists($class)){
                    $newValue = new $class();
                    unset($value->{self::PROP_NAME});
                    if(Util::usesTrait($newValue, ElementTrait::class)) $newValue->set((array)$value);
                    $value = $newValue;
                }
            }
        }

    }

?>