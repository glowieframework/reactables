<?php

/*
    ---------------------------
    Reactables configuration
    ---------------------------
    In this file you can define the Reactables settings.
*/

return [

    // Reactables settings
    'reactables' => [

        // File uploads settings
        'uploads' => [

            // Temporary path to store uploaded files
            'tmp_path' => Util::location('storage/reactables'),

            // Global upload rules for validation
            'rules' => ['upload', 'max:15000']
        ]
    ]
];
