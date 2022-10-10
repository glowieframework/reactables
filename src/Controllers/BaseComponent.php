<?php
    namespace Glowie\Plugins\Reactables\Controllers;

    use Glowie\Core\Http\Controller;
    use Glowie\Core\Element;
    use Glowie\Core\View\View;
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
         * Renders the component view.
         * @param string $component Component view filename. Must be a **.phtml** file inside **app/views/components** folder, extension is not needed.
         * @param array $params (Optional) Parameters to pass into the view. Should be an associative array with each variable name and value.
         */
        final protected function render(string $component, array $params = []){
            $params = array_merge($this->component->toArray(), $params);
            $view = new View('components/' . $component, $params, false);
            $content = $this->putInitialData($view->getContent(), $params);
            echo $content;
        }

        /**
         * Wraps the component with the initial attributes.
         * @param string $content Component HTML content.
         * @param array $params Associative array of parameters to parse.
         * @return string Returns the wrapped component HTML.
         */
        private function putInitialData(string $content, array $params){
            // Get component id
            $id = Util::encryptString(Util::classname($this));

            // Parse initial data
            $json = htmlspecialchars(json_encode($params, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_NUMERIC_CHECK));

            // Wraps the content
            $content = "<r-component r-id=\"$id\" r-data=\"$json\">\n$content\n</r-component>";

            // Returns the content
            return $content;
        }

        /**
         * Use this method to set what the component does after it's initialized or updated.\
         * Here is where you should render the component view using `$this->render()` method.
         */
        public abstract function make();

    }

?>