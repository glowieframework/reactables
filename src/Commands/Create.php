<?php
    namespace Glowie\Plugins\Reactables\Commands;

    use Glowie\Core\CLI\Command;
    use Glowie\Core\Exception\ConsoleException;
    use Glowie\Core\Exception\FileException;
    use Util;

    /**
     * Reactables component creation Firefly command.\
     * Usage: `reactables:create`
     * @category Command
     * @package glowieframework/reactables
     * @author Glowie
     * @copyright Copyright (c) Glowie
     * @license MIT
     * @link https://gabrielsilva.dev.br/glowie
     */
    class Create extends Command{

        /**
         * The command script.
         */
        public function run(){
            // Print title
            $this->print('<bg="yellow"><color="black">Reactables</color></bg> ', false);

            // Validates the component name
            $name = $this->argOrInput('name', '<color="yellow">Please type the component name:</color> ');
            if(Util::isEmpty($name)) throw new ConsoleException('create', $this->getArgs(), 'Missing required argument "name" for this command');

            // Checks if the component exists
            $classname = Util::pascalCase($name);
            $viewname = Util::snakeCase($name);
            $controllerFile = Util::location('controllers/Components/' . $classname . '.php');
            if(is_file($controllerFile)) throw new ConsoleException('create', $this->getArgs(), "Component {$classname} already exists!");

            // Checks components controllers folder
            if(!is_dir(Util::location('controllers/Components'))) mkdir(Util::location('controllers/Components'), 0755, true);
            if(!is_writable(Util::location('controllers/Components'))) throw new FileException('Directory "app/controllers/Components" is not writable, please check your chmod settings');

            // Creates the controller file
            $template = file_get_contents(__DIR__ . '/../Templates/Controller.php');
            $template = str_replace('__FIREFLY_TEMPLATE_NAME__', $classname, $template);
            $template = str_replace('__FIREFLY_TEMPLATE_VIEW__', $viewname, $template);
            file_put_contents($controllerFile, $template);

            // Checks components view folder
            if(!is_dir(Util::location('views/components'))) mkdir(Util::location('views/components'), 0755, true);
            if(!is_writable(Util::location('views/components'))) throw new FileException('Directory "app/views/components" is not writable, please check your chmod settings');

            // Creates the view file
            $template = file_get_contents(__DIR__ . '/../Templates/view.phtml');
            $viewFile = Util::location('views/components/' . $viewname . '.phtml');
            file_put_contents($viewFile, $template);

            // Print results
            $this->success("Component {$classname} created successfully!");
            $this->info("Controller: {$controllerFile}");
            $this->info("View: {$viewFile}");
        }

    }

?>