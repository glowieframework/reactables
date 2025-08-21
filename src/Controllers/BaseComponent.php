<?php

namespace Glowie\Plugins\Reactables\Controllers;

use Glowie\Core\Http\Controller;
use Glowie\Core\View\View;
use Glowie\Core\Http\Session;
use Glowie\Core\Exception\FileException;
use Glowie\Plugins\Reactables\Controllers\ExtendedElement;
use Glowie\Plugins\Reactables\Exception\ComponentException;
use Glowie\Core\Tools\Validator;
use Glowie\Core\Http\Rails;
use Config;
use Util;

/**
 * Reactables base component core.
 * @category Controller
 * @package glowieframework/reactables
 * @author Glowie
 * @copyright Copyright (c) Glowie
 * @license MIT
 * @link https://glowie.gabrielsilva.dev.br/reactables
 */
abstract class BaseComponent extends Controller
{

    /**
     * Component properties.
     * @var ExtendedElement
     */
    protected $props;

    /**
     * Associative array of initial component properties.
     * @var array
     */
    protected $initialProps = [];

    /**
     * Associative array of validation rules.
     * @var array
     */
    protected $rules = [];

    /**
     * Array of file input models and their validation rules (optional).
     * @var array
     */
    protected $files = [];

    /**
     * Array of query string parameters.
     * @var array
     */
    protected $query = [];

    /**
     * Component id.
     * @var string
     */
    private $id;

    /**
     * Validator instance.
     * @var Validator
     */
    private $validator;

    /**
     * Redirect target.
     * @var string|null
     */
    private $redirectTarget;

    /**
     * Array of dispatched events.
     * @var array
     */
    private $events = [];

    /**
     * Array of dispatched global events.
     * @var array
     */
    private $globalEvents = [];

    /**
     * Array of dispatched browser events.
     * @var array
     */
    private $browserEvents = [];

    /**
     * Initializes the component core.
     * @param bool $initialize (Optional) Initialize with default properties.
     */
    public function __initializeComponent(bool $initialize = false)
    {
        $this->props = new ExtendedElement($initialize ? $this->initialProps : []);
        $this->validator = new Validator();
        $this->id = Util::uniqueToken();
    }

    /**
     * Sets the component id.
     * @param string $id Component id to set.
     */
    public function __setComponentId(string $id)
    {
        $this->id = $id;
    }

    /**
     * Fills the component data. This will merge the current data with new props.
     * @param array $props Associative array of properties with each variable name and value to fill.
     * @param bool $invokeTypes (Optional) Set if should cast the types back to the original ones.
     */
    public function __fillComponentData(array $props, bool $invokeTypes = false)
    {
        $this->props->set($props, null, false, $invokeTypes);
    }

    /**
     * Gets the component data as a JSON string object.
     * @return string Returns the component data.
     */
    public function __getComponentData()
    {
        return $this->props->toJson(JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES, 512, true);
    }

    /**
     * Fills the component data using query string parameters.
     */
    public function __fillQueryParams()
    {
        if (empty($this->query)) return;
        foreach ($this->query as $key => $item) {
            if (!is_numeric($key)) $item = $key;
            if ($this->get->has($item)) $this->props->set($item, $this->get->get($item, ''));
        }
    }

    /**
     * Builds the query string parameters.
     * @return string Returns the query string URL.
     */
    public function __buildQueryString()
    {
        if (empty($this->query)) return null;
        $result = [];
        foreach ($this->query as $key => $item) {
            if (is_numeric($key)) {
                if ($this->props->has($item)) $result[$item] = $this->props->get($item, '');
            } else {
                if ($this->props->has($key)) {
                    $val = $this->props->get($key, '');
                    if (!in_array($val, (array)$item)) $result[$key] = $val;
                }
            }
        }
        return http_build_query($result);
    }

    /**
     * Sets magically the value of a property.
     * @param array $params Array of parameters. First parameter is the variable name, second the value.
     */
    public function __magicSet(array $params)
    {
        if (!isset($params[0])) throw new ComponentException('Missing prop name in "$set" magic method call');
        $this->props->set($params[0], $params[1] ?? null);
    }

    /**
     * Toggles magically the value of a boolean property.
     * @param array $params Array of parameters. First parameter is the variable name.
     */
    public function __magicToggle(array $params)
    {
        if (!isset($params[0])) throw new ComponentException('Missing prop name in "$toggle" magic method call');
        if (!filter_var($this->props->get($params[0], false), FILTER_VALIDATE_BOOLEAN)) {
            $this->props->set($params[0], true);
        } else {
            $this->props->set($params[0], false);
        }
    }

    /**
     * Dispatches magically an event.
     * @param array $params Array of parameters. First parameter is the event name, then the other parameters.
     */
    public function __magicDispatch(array $params, bool $global = false, bool $browser = false)
    {
        if (!isset($params[0])) throw new ComponentException('Missing event name in "$dispatch" magic method call');
        if ($global) return $this->dispatchGlobal($params[0], array_slice($params, 1));
        if ($browser) return $this->dispatchBrowser($params[0], array_slice($params, 1));
        return $this->dispatch($params[0], array_slice($params, 1));
    }

    /**
     * Calls a method from the component.
     * @param string $method Method signature to call.
     */
    public function __callMethod(string $method, array $params = [])
    {
        if (!is_callable([$this, $method])) throw new ComponentException("Invalid component method call \"$method\"");
        call_user_func_array([$this, $method], $params);
    }


    /**
     * Renders the component view.
     * @param string $component Component view filename. Must be a **.phtml** file inside **app/views/components** folder, extension is not needed.
     * @param array $props (Optional) Parameters to pass into the component. Should be an associative array with each variable name and value.
     * @param bool $absolute (Optional) Use an absolute path for the view file.
     */
    final protected function render(string $component, array $props = [], bool $absolute = false)
    {
        $this->__fillComponentData($props);
        $view = new View(!$absolute ? ('components/' . $component) : $component, $this->props->toArray(), false, $absolute);
        $content = $this->putData($view->getContent());
        echo $content;
    }

    /**
     * Renders the component view inline.
     * @param string $content Component content in HTML.
     * @param array $props (Optional) Parameters to pass into the component. Should be an associative array with each variable name and value.
     */
    final protected function inline(string $content, array $props = [])
    {
        $filename = Util::location('storage/cache/' . md5($content) . '.phtml');
        file_put_contents($filename, $content);
        $this->render($filename, $props, true);
    }

    /**
     * Renders the component view in a private scope.
     * @param string $component Component view filename. Must be a **.phtml** file inside **app/views/components** folder, extension is not needed.
     * @param array $props (Optional) Parameters to pass into the component. Should be an associative array with each variable name and value.
     * @param bool $absolute (Optional) Use an absolute path for the view file.
     */
    final protected function renderPrivate(string $component, array $props = [], bool $absolute = false)
    {
        $this->__fillComponentData($props);
        $view = new View(!$absolute ? ('components/' . $component) : $component, $this->props->toArray(), true, $absolute);
        $content = $this->putData($view->getContent());
        echo $content;
    }

    /**
     * Validates the component data using the `$rules` property and Glowie `Validator`.
     * @param array $rules (Optional) Associative array of custom validation rules. Leave empty to use your component default rules.
     * @param bool $bail (Optional) Stop validation of each property after first failure found.
     * @param bool $bailAll (Optional) Stop validation of the component after first failure found.
     * @return bool Returns true if all rules passed for all properties, false otherwise.
     */
    final protected function validate(array $rules = [], bool $bail = false, bool $bailAll = false)
    {
        if (empty($rules)) $rules = $this->rules;
        if (empty($rules)) return true;
        return $this->validator->validateFields($this->props, $rules, $bail, $bailAll);
    }

    /**
     * Checks if a component property is invalid.
     * @param string|null $key (Optional) Property name to check, leave empty to check all.
     * @return bool Returns true if the property is invalid, false otherwise.
     */
    final protected function isInvalid(?string $key = null)
    {
        return $this->validator->hasErrors($key);
    }

    /**
     * Gets the Validator instance associated with the component.
     * @return Validator The validator instance.
     */
    final protected function getValidator()
    {
        return $this->validator;
    }

    /**
     * Redirects the user to another page.
     * @param string $url URL to redirect the user to.
     */
    final protected function redirect(string $url)
    {
        $this->redirectTarget = $url;
    }

    /**
     * Returns the redirect target, if any.
     * @return string|null Redirect URL or null.
     */
    public function __getRedirectTarget()
    {
        return $this->redirectTarget;
    }

    /**
     * Handles temporary file uploads.
     */
    public function __handleUploads()
    {
        // Checks if file models were set
        if (!empty($this->files)) {

            // Checks for each file input
            foreach ($this->files as $key => $input) {
                // Check validation ruleset
                if (!is_numeric($key)) {
                    $rules = $input;
                    $input = $key;
                } else {
                    $rules = [];
                }

                // Get request files
                $files = $this->request->getFiles($input);
                if (empty($files)) continue;

                // Performs the temporary uploads
                $result = [];
                foreach ($files as $file) {
                    // Checks if the upload has errors
                    if (!empty($file->error)) continue;

                    // Checks if the target directory is writable
                    $target = rtrim(Config::get('reactables.uploads.tmp_path', Util::location('storage/reactables')), '/\\');
                    if (!is_dir($target)) @mkdir($target, 0755, true);
                    if (!is_writable($target)) throw new FileException('Directory "' . $target . '" is invalid or not writable');

                    // Validate the file
                    $rules = array_merge(Config::get('reactables.uploads.rules', ['upload', 'max:15000']), $rules);
                    if (!$this->validator->validate($file->tmp_name, $rules, true)) continue;

                    // Upload the file
                    $target = $target . '/' . Util::uniqueToken() . '.tmp';
                    if (is_uploaded_file($file->tmp_name) && @move_uploaded_file($file->tmp_name, $target)) {
                        $newFile = new UploadedFile($file->toArray());
                        $newFile->tmp_name = $target;
                        $result[] = $newFile;
                    }
                }

                // Parse the first file only on single upload
                if (count($result) === 1 && !empty($result[0])) $result = $result[0];

                // Sets the result to the component property
                $this->props->set($input, $result);
            }
        }
    }

    /**
     * Dispatches an event in the component.
     * @param string $name Name of the event to dispatch.
     * @param array $params (Optional) Associative array of params to pass with the event.
     */
    final protected function dispatch(string $name, array $params = [])
    {
        $this->events[] = [
            'name' => $name,
            'params' => $params
        ];
    }

    /**
     * Dispatches an event globally.
     * @param string $name Name of the event to dispatch.
     * @param array $params (Optional) Associative array of params to pass with the event.
     */
    final protected function dispatchGlobal(string $name, array $params = [])
    {
        $this->globalEvents[] = [
            'name' => $name,
            'params' => $params
        ];
    }

    /**
     * Dispatches an event to the browser.
     * @param string $name Name of the event to dispatch.
     * @param array $params (Optional) Associative array of params to pass with the event.
     */
    final protected function dispatchBrowser(string $name, array $params = [])
    {
        $this->browserEvents[] = [
            'name' => $name,
            'params' => $params
        ];
    }

    /**
     * Returns an array of the dispatched events and their params.
     * @return array Array of dispatched events.
     */
    public function __getDispatchedEvents()
    {
        return [
            'component' => $this->events,
            'global' => $this->globalEvents,
            'browser' => $this->browserEvents
        ];
    }

    /**
     * Resets a component prop to its initial value.
     * @param string|array $key (Optional) The prop name to reset, you can also use an array of prop names. Leave empty to reset all.
     */
    final public function resetProps($key = null)
    {
        if (is_null($key)) $key = array_keys($this->props->toArray());
        foreach ((array)$key as $name) {
            if (isset($this->initialProps[$name])) {
                $this->props->set($name, $this->initialProps[$name]);
            } else {
                $this->props->set($name, null);
            }
        }
    }

    /**
     * Pumps the component with the data attributes.
     * @param string $content Component HTML content.
     * @return string Returns the pumped component HTML.
     */
    private function putData(string $content)
    {
        // Parse component data
        $id = $this->id;
        $data = [
            'name' => Util::classname($this),
            'data' => $this->__getComponentData(),
            'checksum' => $this->checksum(),
            'route' => Util::encryptString(Rails::getCurrentRoute()),
            'base_url' => Util::baseUrl()
        ];

        // Pumps the content
        $content = preg_replace_callback('~<([^\s]+)(.*)>~', function ($matches) use ($id, $data) {
            return sprintf(
                '<%s%s r:id="%s" r:data="%s">',
                $matches[1],
                $matches[2],
                $id,
                htmlspecialchars(Util::jsonEncode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES))
            );
        }, $content, 1);

        // Replace find component directive
        $content = preg_replace('~\$__component~i', 'window.reactables.find(\'' . $id . '\')', $content);

        // Returns the content
        return $content;
    }

    /**
     * Returns the session checksum if already exists or creates a new one.
     * @return string Returns the stored or new checksum for the current session.
     */
    private function checksum()
    {
        $session = new Session();
        if ($session->has('REACTABLES_CHECKSUM')) return $session->get('REACTABLES_CHECKSUM');
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
