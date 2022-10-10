<?php
    namespace Glowie\Commands;

    use Glowie\Core\CLI\Command;
    use Glowie\Plugins\Reactables\Reactables;
    use Util;

    /**
     * Reactables create component command.
     * @category Command
     * @package glowieframework/glowie-reactables
     * @author Glowie
     * @copyright Copyright (c) Glowie
     * @license MIT
     * @link https://glowie.tk
     */
    class CreateComponent extends Command{

        /**
         * The command script.
         */
        public function run(){
            $name = $this->argOrInput('name', 'Component name: ');
            Reactables::createComponent($name, $this->getArgs());
            $name = Util::pascalCase($name);
            $this->success("Component {$name} created successfully!");
        }

    }

?>