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
         * Sets if the component is refreshing instead of creating.
         * @var bool
         */
        private $isRefreshing = false;

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
         * Gets the component data as a JSON string.
         * @return string Returns the component data.
         */
        final public function getComponentData(){
            return $this->component->toJson();
        }

        /**
         * Sets if the component is refreshing instead of creating.
         * @param bool $option (Option) Set to `true` if the component is refreshing, `false` if creating.
         */
        final public function setRefresh(bool $option = true){
            $this->isRefreshing = $option;
        }

        /**
         * Renders the component view.
         * @param string $component Component view filename. Must be a **.phtml** file inside **app/views/components** folder, extension is not needed.
         * @param array $params (Optional) Parameters to pass into the view. Should be an associative array with each variable name and value.
         */
        final protected function render(string $component, array $params = []){
            $this->fillComponentParams($params);
            $view = new View('components/' . $component, $this->component->toArray(), false);

            if($this->isRefreshing){
                $content = $view->getContent();
            }else{
                $content = $this->putInitialData($view->getContent());
            }

            echo $content;
        }

        /**
         * Wraps the component with the initial attributes.
         * @param string $content Component HTML content.
         * @return string Returns the wrapped component HTML.
         */
        private function putInitialData(string $content){
            // Get component id
            $id = Util::encryptString(Util::classname($this));

            // Parse initial data
            $json = htmlspecialchars($this->getComponentData());

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