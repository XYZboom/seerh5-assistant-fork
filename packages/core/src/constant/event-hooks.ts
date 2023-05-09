export const Hook = {
    Module: {
        loadScript: 'sa_module_script_loaded',
        construct: 'sa_module_construct',
        destroy: 'sa_module_destroy',
    },
    BattlePanel: {
        panelReady: 'sa_battle_start',
        roundEnd: 'sa_battle_roundEnd',
        endPropShown: 'sa_battle_resultPanel_show',
        battleEnd: 'sa_battle_end',
    },
    Award: {
        show: 'sa_award_show',
        receive: 'sa_award_receive',
    },
    Socket: {
        send: 'sa_socket_send',
    },
    PetBag: {
        update: 'sa_pet_bag_update',
        deactivate: 'sa_pet_bag_deactivate',
    },
} as const;
