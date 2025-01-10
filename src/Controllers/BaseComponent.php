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
 * @link https://gabrielsilva.dev.br/glowie/reactables
 */
abstract class BaseComponent extends Controller
{

    /**
     * Component parameters.
     * @var ExtendedElement
     */
    protected $component;

    /**
     * Associative array of initial component attributes.
     * @var array
     */
    protected $attributes = [];

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
     * Array of global file upload validation rules.
     * @var array
     */
    protected $uploadRules = ['upload', 'max:15000'];

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
     * Initializes the component core.
     * @param bool $withAttributes (Optional) Initialize with default attributes.
     */
    final public function initializeComponent(bool $withAttributes = false)
    {
        $this->component = new ExtendedElement($withAttributes ? $this->attributes : []);
        $this->validator = new Validator();
        $this->id = Util::uniqueToken();
    }

    /**
     * Sets the component id.
     * @param string $id Component id to set.
     */
    final public function setComponentId(string $id)
    {
        $this->id = $id;
    }

    /**
     * Fills the component data. This will merge the current data with new parameters.
     * @param array $params Associative array of parameters with each variable name and value to fill.
     */
    final public function fillComponentParams(array $params, bool $invokeTypes = false)
    {
        $this->component->set($params, null, false, $invokeTypes);
    }

    /**
     * Gets the component data as a JSON string object.
     * @return string Returns the component data.
     */
    final public function getComponentData()
    {
        return $this->component->toJson(JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES, 512, true);
    }

    /**
     * Fills the component data using query string parameters.
     */
    final public function fillQueryParams()
    {
        if (empty($this->query)) return;
        foreach ($this->query as $key => $item) {
            if (!is_numeric($key)) $item = $key;
            if ($this->get->has($item)) $this->component->set($item, $this->get->get($item, ''));
        }
    }

    /**
     * Builds the query string parameters.
     * @return string Returns the query string URL.
     */
    final public function buildQueryString()
    {
        if (empty($this->query)) return null;
        $result = [];
        foreach ($this->query as $key => $item) {
            if (is_numeric($key)) {
                if ($this->component->has($item)) $result[$item] = $this->component->get($item, '');
            } else {
                if ($this->component->has($key)) {
                    $val = $this->component->get($key, '');
                    if (!in_array($val, (array)$item)) $result[$key] = $val;
                }
            }
        }
        return http_build_query($result);
    }

    /**
     * Sets magically the value of a property.
     * @param string $call Method call.
     */
    final public function magicSet(string $call)
    {
        if (!preg_match('~\$set\(\'(.+)\' *, *\'(.+)\'\)~', $call, $matches)) return;
        $this->component->set($matches[1], $matches[2]);
    }

    /**
     * Toggles magically the value of a boolean property.
     * @param string $call Method call.
     */
    final public function magicToggle(string $call)
    {
        if (!preg_match('~\$toggle\(\'(.+)\'\)~', $call, $matches)) return;
        if (!filter_var($this->component->get($matches[1], false), FILTER_VALIDATE_BOOLEAN)) {
            $this->component->set($matches[1], true);
        } else {
            $this->component->set($matches[1], false);
        }
    }

    /**
     * Renders the component view.
     * @param string $component Component view filename. Must be a **.phtml** file inside **app/views/components** folder, extension is not needed.
     * @param array $params (Optional) Parameters to pass into the view. Should be an associative array with each variable name and value.
     * @param bool $absolute (Optional) Use an absolute path for the view file.
     */
    final protected function render(string $component, array $params = [], bool $absolute = false)
    {
        $this->fillComponentParams($params);
        $view = new View(!$absolute ? ('components/' . $component) : $component, $this->component->toArray(), false, $absolute);
        $content = $this->putData($view->getContent());
        echo $content;
    }

    /**
     * Renders the component view in a private scope.
     * @param string $component Component view filename. Must be a **.phtml** file inside **app/views/components** folder, extension is not needed.
     * @param array $params (Optional) Parameters to pass into the view. Should be an associative array with each variable name and value.
     * @param bool $absolute (Optional) Use an absolute path for the view file.
     */
    final protected function renderPrivate(string $component, array $params = [], bool $absolute = false)
    {
        $this->fillComponentParams($params);
        $view = new View(!$absolute ? ('components/' . $component) : $component, $this->component->toArray(), true, $absolute);
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
        return $this->validator->validateFields($this->component, $rules, $bail, $bailAll);
    }

    /**
     * Returns an associative array with the latest validation errors.
     * @param string|null $key (Optional) Property name to get errors. Leave blank to get all.
     * @return array Returns an array with the fetched errors.
     */
    final protected function getValidationErrors(?string $key = null)
    {
        return $this->validator->getErrors($key);
    }

    /**
     * Checks if a property is invalid. You must call `$this->validate()` first.
     * @param string $key Property name to check for validation errors.
     * @param string|null $rule (Optional) Specific rule to check for errors in the property. Leave blank to check all.
     * @return bool Returns if the property validation has the specified errors.
     */
    final protected function isInvalid(string $key, ?string $rule = null)
    {
        return $this->validator->hasError($key, $rule);
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
    final public function getRedirectTarget()
    {
        return $this->redirectTarget;
    }

    /**
     * Handles temporary file uploads.
     */
    final public function handleUploads()
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
                    if (!empty($file->error)) continue;
                    $target = rtrim(Config::get('reactables.tmp_path', Util::location('storage/reactables')), '/\\');
                    if (!is_dir($target)) @mkdir($target, 0755, true);
                    if (!is_writable($target)) throw new FileException('Directory "' . $target . '" is invalid or not writable');

                    // Validate the file
                    if (!$this->validator->validate($file->tmp_name, array_merge($this->uploadRules, $rules), true)) continue;

                    // Upload the file
                    $target = $target . '/' . Util::uniqueToken() . '.tmp';
                    if (@move_uploaded_file($file->tmp_name, $target)) {
                        $file->tmp_name = $target;
                        $result[] = $file;
                    }
                }

                // Parse the first file only
                if (count($result) == 1 && !empty($result[0])) $result = $result[0];

                // Sets the result to the component property
                $this->component->set($input, $result);
            }
        }
    }

    /**
     * Previews an uploaded file.
     * @param object $file The temporary uploaded file instance.
     * @return string|bool Returns the preview as a **base64 string** on success, false on errors.
     */
    final protected function previewUpload(object $file)
    {
        if (!isset($file->tmp_name) || !isset($file->type)) throw new ComponentException('previewUpload(): Not a valid file');
        $content = @file_get_contents($file->tmp_name);
        if (!$content) return false;
        return 'data: ' . $file->type . ';base64,' . base64_encode($content);
    }

    /**
     * Stores a temporary uploaded file in a definitive way.
     * @param object $file The temporary uploaded file instance.
     * @param string $directory (Optional) Target directory to store the file. Must be an existing directory with write permissions,\
     * absolute path or relative to the **app/public** folder.
     * @param string|null $filename (Optional) Custom filename, leave empty to use the original filename. **This overwrites existing files!**
     * @return string|bool Returns the resulting filename path on success, false on errors.
     */
    final protected function storeUpload(object $file, string $directory = 'uploads', ?string $filename = null)
    {
        // Validate file
        if (!isset($file->tmp_name) || !isset($file->name)) throw new ComponentException('storeUpload(): Not a valid file');

        // Checks for target folder
        $directory = rtrim($directory, '/\\');
        if (!is_writable($directory)) throw new FileException('Directory "' . $directory . '" is invalid or not writable');

        // Move the temp file to the target folder
        $target = $directory . '/' . ($filename ?? $file->name);
        $result = @rename($file->tmp_name, $target);
        return $result ? $target : false;
    }

    /**
     * Discards a temporary uploaded file, deleting it.
     * @param object $file The temporary uploaded file instance.
     * @return bool Returns true on success or false on failure.
     */
    final protected function discardUpload(object $file)
    {
        if (!isset($file->tmp_name)) throw new ComponentException('discardUpload(): Not a valid file');
        return @unlink($file->tmp_name);
    }

    /**
     * Dispatches an event in the component.
     * @param string $name Name of the event to dispatch.
     * @param array $params (Optional) Array of params to pass with the event.
     */
    final protected function dispatchEvent(string $name, array $params = [])
    {
        $this->events[] = [
            'name' => $name,
            'params' => array_values($params)
        ];
    }

    /**
     * Returns an array of the dispatched events and their params.
     * @return array Array of dispatched events.
     */
    final public function getDispatchedEvents()
    {
        return $this->events;
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
            'data' => $this->getComponentData(),
            'checksum' => $this->checksum(),
            'route' => Util::encryptString(Rails::getCurrentRoute()),
            'base_url' => Util::baseUrl()
        ];

        // Pumps the content
        $content = preg_replace_callback('~<([^\s]+)(.*)>~', function ($matches) use ($id, $data) {
            return sprintf(
                '<%s%s r-id="%s" r-data="%s">',
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
