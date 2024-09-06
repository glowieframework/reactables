<?php

namespace Glowie\Plugins\Reactables\Middlewares;

use Glowie\Core\Http\Middleware;
use Glowie\Core\Http\Session;
use Glowie\Plugins\Reactables\Reactables;

/**
 * Reactables checksum validation middleware.
 * @category Middleware
 * @package glowieframework/reactables
 * @author Glowie
 * @copyright Copyright (c) Glowie
 * @license MIT
 * @link https://gabrielsilva.dev.br/glowie/reactables
 */
class ValidateChecksum extends Middleware
{

    /**
     * The middleware handler.
     * @return bool Should return true on success or false on fail.
     */
    public function handle()
    {
        // Validates the header
        if (!Reactables::isReactablesRequest()) return false;

        // Retrieves the token from POST field
        $token = $this->post->checksum;

        // Validates the token
        if (empty($token)) return false;

        // Compare to the session token
        $session = new Session();
        if (!$session->has('REACTABLES_CHECKSUM')) return false;
        return hash_equals($session->get('REACTABLES_CHECKSUM'), $token);
    }
}
