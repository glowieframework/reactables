<?php
    namespace Glowie\Plugins\Reactables\Commands;

    use Glowie\Core\CLI\Command;
    use Glowie\Plugins\Reactables\Reactables;

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
            $result = Reactables::createComponent($name, $this->getArgs());
            $this->success("Component {$result['classname']} created successfully!");
            $this->info("Controller: {$result['controllerFile']}");
            $this->info("View: {$result['viewFile']}");
        }

    }

?>