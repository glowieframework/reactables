<?php
    namespace Glowie\Plugins\Reactables\Controllers;

    use Glowie\Core\Http\Controller;
    use Glowie\Core\Element;
    use Glowie\Core\View\View;
    use Glowie\Core\Http\Session;
    use Glowie\Core\Tools\Validator;
    use Util;

    /**
     * Reactables base component controller.
     * @category Controller
     * @package glowieframework/glowie-reactables
     * @author Glowie
     * @copyright Copyright (c) Glowie
     * @license MIT
     * @link https://glowie.tk
     */
    abstract class BaseComponent extends Controller{

        /**
         * Component parameters.
         * @var Element
         */
        protected $component;

        /**
         * Associative array of validation rules.
         * @var array
         */
        protected $rules = [];

        /**
         * Validator instance.
         * @var Validator
         */
        private $validator;

        /**
         * Initializes the component core.
         */
        final public function initializeComponent(){
            $this->component = new Element();
        }

        /**
         * Fills the component data. This will merge the current data with new parameters.
         * @param array $params Associative array of parameters with each variable name and value to fill.
         */
        final public function fillComponentParams(array $params){
            $params = array_merge($this->component->toArray(), $params);
            $this->component = new Element($params);
        }

        /**
         * Gets the component data as a JSON string object.
         * @return string Returns the component data.
         */
        final public function getComponentData(){
            if(empty($this->component->toArray())) return '{}';
            return $this->component->toJson();
        }

        /**
         * Sets magically the value of a property.
         * @param string $call Method call.
         */
        final public function magicSet(string $call){
            if(!preg_match('~\$set\(\'(.+)\' *, *(.+)\)~', $call, $matches)) return;
            if(count($matches) == 3) $this->component->set($matches[1], $matches[2]);
        }

        /**
         * Toggles magically the value of a boolean property.
         * @param string $call Method call.
         */
        final public function magicToggle(string $call){
            if(!preg_match('~\$toggle\(\'(.+)\'\)~', $call, $matches)) return;
            if(count($matches) == 2){
                if(!filter_var($this->component->get($matches[1], false), FILTER_VALIDATE_BOOLEAN)){
                    $this->component->set($matches[1], true);
                }else{
                    $this->component->set($matches[1], false);
                }
            }
        }

        /**
         * Renders the component view.
         * @param string $component Component view filename. Must be a **.phtml** file inside **app/views/components** folder, extension is not needed.
         * @param array $params (Optional) Parameters to pass into the view. Should be an associative array with each variable name and value.
         */
        final protected function render(string $component, array $params = []){
            $this->fillComponentParams($params);
            $view = new View('components/' . $component, $this->component->toArray());
            $content = $this->putData($view->getContent());
            echo $content;
        }

        /**
         * Validates the component data using the `$rules` property and Glowie `Validator`.
         * @param bool $bail (Optional) Stop validation of each property after first failure found.
         * @param bool $bailAll (Optional) Stop validation of the component after first failure found.
         * @return bool Returns true if all rules passed for all properties, false otherwise.
         */
        final protected function validate(bool $bail = false, bool $bailAll = false){
            if(!$this->validator) $this->validator = new Validator();
            if(empty($this->rules)) return true;
            return $this->validator->validateFields($this->component, $this->rules, $bail, $bailAll);
        }

         /**
         * Returns an associative array with the latest validation errors.
         * @param string|null $key (Optional) Property name to get errors. Leave blank to get all.
         * @return array Returns an array with the fetched errors.
         */
        final protected function getValidationErrors(?string $key = null){
            if(!$this->validator) $this->validator = new Validator();
            return $this->validator->getErrors($key);
        }

        /**
         * Checks if a property is invalid. You must call `$this->validate()` first.
         * @param string $key Property name to check for validation errors.
         * @param string|null $rule (Optional) Specific rule to check for errors in the property. Leave blank to check all.
         * @return bool Returns if the property validation has the specified errors.
         */
        final protected function isInvalid(string $key, ?string $rule = null){
            if(!$this->validator) $this->validator = new Validator();
            return $this->validator->hasError($key, $rule);
        }

        /**
         * Pumps the component with the data attributes.
         * @param string $content Component HTML content.
         * @return string Returns the pumped component HTML.
         */
        private function putData(string $content){
            // Get component id and checksum
            $id = Util::encryptString(Util::classname($this));
            $checksum = $this->checksum();

            // Parse component data
            $json = htmlspecialchars($this->getComponentData());

            // Pumps the content
            $content = preg_replace('~<([^\s]+)(.*)>~', '<$1$2 r-id="' . $id . '" r-checksum="' . $checksum . '" r-data="' . $json . '" r-base-url="' . Util::baseUrl() . '">', $content, 1);

            // Replace find component directive
            $content = preg_replace('~\[r-component\]~i', 'window.reactables.find(\'' . $id . '\')', $content);

            // Returns the content
            return $content;
        }

        /**
         * Returns the session checksum if already exists or creates a new one.
         * @return string Returns the stored or new checksum for the current session.
         */
        private function checksum(){
            $session = new Session();
            if($session->has('REACTABLES_CHECKSUM')) return $session->get('REACTABLES_CHECKSUM');
            $token = Util::randomToken();
            $session->set('REACTABLES_CHECKSUM', $token);
            return $token;
        }

        /**
         * Use this method to set what the component does after it's initialized or updated.\
         * Here is where you should render the component view using `$this->render()` method.
         */
        public abstract function make();

    }

?>