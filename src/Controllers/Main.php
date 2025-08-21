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
        $class->__initializeComponent();
        if (!empty($data->id)) $class->__setComponentId($data->id);
        if (!empty($data->data)) $class->__fillComponentData(json_decode($data->data, true) ?? [], true);

        // Handle uploads
        if (!empty($_FILES)) $class->__handleUploads();

        // Call update method
        if (is_callable([$class, 'update'])) call_user_func([$class, 'update']);

        // Check method call
        if (!empty($data->method)) {
            // Trim string and parse params
            $data->method = trim($data->method);
            if (!empty($data->params)) {
                $data->params = json_decode($data->params, true) ?? [];
            } else {
                $data->params = [];
            }

            // Check magic actions
            switch ($data->method) {
                case '$refresh':
                    //* Do nothing, refresh the component only
                    break;
                case '$set':
                    $class->__magicSet($data->params);
                    break;
                case '$toggle':
                    $class->__magicToggle($data->params);
                    break;
                case '$dispatch':
                    $class->__magicDispatch($data->params);
                    break;
                case '$dispatchGlobal':
                    $class->__magicDispatch($data->params, true);
                    break;
                case '$dispatchBrowser':
                    $class->__magicDispatch($data->params, false, true);
                    break;
                default:
                    $class->__callMethod($data->params);
                    break;
            }
        }

        // Check for redirect instruction
        $redirect = $class->__getRedirectTarget();
        if ($redirect) return $this->response->setJson(['status' => true, 'redirect' => $redirect]);

        // Refresh component
        Buffer::start();
        $class->make();
        $html = Buffer::get();

        // Return response
        return $this->response->setJson([
            'status' => true,
            'html' => $html,
            'query' => $class->__buildQueryString(),
            'data' => $class->__getComponentData(),
            'events' => $class->__getDispatchedEvents()
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
