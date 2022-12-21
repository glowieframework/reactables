<?php
    namespace Glowie\Plugins\Reactables\Controllers;

    use Glowie\Core\Http\Controller;
    use Glowie\Core\Element;
    use Glowie\Core\View\View;
    use Glowie\Core\Http\Session;
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
            return $this->component->toJson(JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
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
            $content = preg_replace('~<([^\s]+([^\s>]+))>~', '<$1 r-id="' . $id . '" r-checksum="' . $checksum . '" r-data="' . $json . '">', $content, 1);

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