<?php

namespace Glowie\Controllers\Components;

use Glowie\Plugins\Reactables\Controllers\BaseComponent;

/**
 * __FIREFLY_TEMPLATE_NAME__ component controller.
 * @category Controller
 * @package glowieframework/reactables
 * @author Glowie
 * @copyright Copyright (c) Glowie
 * @license MIT
 * @link https://glowie.gabrielsilva.dev.br/reactables
 */
class __FIREFLY_TEMPLATE_NAME__ extends BaseComponent
{

    /**
     * This method runs before the `make()` method, only when the component is **created for the first time**.\
     * Use this method as the component "constructor". **It will not be called when it's updated.**
     */
    public function create()
    {
        //
    }

    /**
     * This method runs before the `make()` method, only when the component is **updated**.\
     * **It will not be called when it's created.**
     */
    public function update()
    {
        //
    }

    /**
     * Use this method to set what the component does after it's **created or updated**.\
     * Here is where you should render the component view using the `inline()` method.
     */
    public function make()
    {
        $this->inline(
            '<div>
                {# Create your component view here #}
                {# It must be wrapped into a single root element #}
            </div>'
        );
    }
}
