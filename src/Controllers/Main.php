<?php

namespace Glowie\Plugins\Reactables\Controllers;

use Glowie\Core\Http\Controller;
use Glowie\Core\View\Buffer;
use Glowie\Plugins\Reactables\Exception\ComponentException;
use Util;

/**
 * Controller for handling Reactables routes.
 * @category Controller
 * @package glowieframework/reactables
 * @author Glowie
 * @copyright Copyright (c) Glowie
 * @license MIT
 * @link https://glowie.gabrielsilva.dev.br/reactables
 */
class Main extends Controller
{

    /**
     * Handles the component update AJAX route.
     */
    public function update()
    {
        // Get request data
        $data = $this->post;
        if (empty($data->name)) return;

        // Instantiate component class
        $name = Util::pascalCase($data->name);
        $class = '\Glowie\Controllers\Components\\' . $name;
        if (!class_exists($class)) throw new ComponentException('Component "' . $name . '" does not exist');

        // Initialize component data
        $class = new $class;
        $class->initializeComponent();
        if (!empty($data->id)) $class->setComponentId($data->id);
        if (!empty($data->data)) $class->fillComponentData((array)json_decode($data->data), true);

        // Handle uploads
        if (!empty($_FILES)) $class->handleUploads();

        // Call update method
        if (is_callable([$class, 'update'])) call_user_func([$class, 'update']);

        // Check method call
        if (!empty($data->method)) {
            // Trim string to avoid errors
            $data->method = trim($data->method);

            // Check magic actions
            if ($data->method == '$refresh()') {
                // Do nothing, refresh the component only
            } else if (Util::startsWith($data->method, '$set(')) {
                $class->magicSet($data->method);
            } else if (Util::startsWith($data->method, '$toggle(')) {
                $class->magicToggle($data->method);
            } else {
                eval('$class->' . $data->method . ';');
            }
        }

        // Check for redirect instruction
        $redirect = $class->getRedirectTarget();
        if ($redirect) return $this->response->setJson(['status' => true, 'redirect' => $redirect]);

        // Refresh component
        Buffer::start();
        $class->make();
        $html = Buffer::get();

        // Return response
        return $this->response->setJson([
            'status' => true,
            'html' => $html,
            'query' => $class->buildQueryString(),
            'data' => $class->getComponentData(),
            'events' => $class->getDispatchedEvents()
        ]);
    }

    /**
     * Handles the assets loader route.
     */
    public function assets()
    {
        return $this->response->disableCache()
            ->setFile(__DIR__ . '/../Assets/dist/reactables.dist.min.js');
    }
}
