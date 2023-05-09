import { Button, Checkbox, TableCell } from '@mui/material';
import { PopupMenu, usePopupMenuState } from '@sa-app/components/common/PopupMenu';
import { SALocalStorage } from '@sa-app/provider/GlobalConfig';
import { mainColor } from '@sa-app/style';
import React from 'react';
import {
    Hook,
    PetPosition,
    SAEngine,
    SAEntity,
    SAEventHandler,
    SAEventTarget,
    SAPet,
    delay,
    getBagPets,
    lowerBlood,
    switchBag,
} from 'seerh5-assistant-core';
import { PanelTableBase, PanelTableBodyRow } from '../base';

const petGroupsStorage = SALocalStorage.PetGroups;
let timer: null | number = null;

export function PetBagController() {
    const [pets, setPets] = React.useState<SAEntity.Pet[]>([]);
    const [petHeadSrc, setPetHeadSrc] = React.useState<string[]>([]);

    const [selected, setSelected] = React.useState<boolean[]>([]);

    const [petGroups, setPetGroups] = React.useState(petGroupsStorage.ref);

    const [menuProps, openMenu] = usePopupMenuState<number[]>();

    const updatePets = () => {
        if (timer) {
            clearTimeout(timer);
        }
        timer = window.setTimeout(async () => {
            const pets = await getBagPets(PetPosition.bag1);
            setPets(pets);
            setSelected(pets.map(() => false));
            Promise.all(pets.map((v) => ClientConfig.getPetHeadPath(v.id)).map(SAEngine.getImageResourceUrl)).then(
                (v) => setPetHeadSrc(v)
            );
        }, 200);
    };

    React.useEffect(() => {
        updatePets();
        SAEventTarget.addEventListener(Hook.PetBag.deactivate, updatePets);
        SAEventTarget.addEventListener(Hook.PetBag.update, updatePets);
        return () => {
            SAEventTarget.removeEventListener(Hook.PetBag.deactivate, updatePets);
            SAEventTarget.removeEventListener(Hook.PetBag.update, updatePets);
        };
    }, []);

    const handleLowerBlood = () => {
        const lowerBloodPets = pets.filter((pet, index) => selected[index]);
        lowerBlood(lowerBloodPets.map((p) => p.catchTime));
    };

    const handleCurePets = () => {
        const curePets = pets.filter((pet, index) => selected[index]);
        for (let curePet of curePets) {
            SAPet(curePet.catchTime).cure();
        }
    };

    const handleOpenPetItemUseProp = async (ct: number) => {
        await ModuleManager.showModule('petBag');
        const petBagModule = SAEngine.SeerModuleHelper.currentModule<petBag.PetBag>();
        const petBagPanel = petBagModule.currentPanel!;
        await delay(300);
        petBagPanel.onSelectPet({ data: PetManager.getPetInfo(ct) });
        await delay(300);
        petBagPanel.showDevelopBaseView();
        petBagPanel.showDevelopView(9);
    };

    const handleCopyCatchTime = () => {
        navigator.clipboard.writeText(
            JSON.stringify(pets.map((pet) => ({ name: pet.name, catchTime: pet.catchTime })))
        );
        BubblerManager.getInstance().showText('复制成功');
    };

    const handleChangePetPattern: React.MouseEventHandler<HTMLButtonElement> = async (e) => {
        const target = e.currentTarget;
        const pattern = [];
        for (let index = 0; index < petGroups.length; index++) {
            const pets = await Promise.all(petGroups[index]?.map(Number).map((ct) => SAPet(ct).name) ?? []);
            const name = `方案${index}: ${pets.join(',')}`;
            pattern.push(name);
        }

        openMenu(target, {
            data: petGroups,
            displayText: pattern,
            handler: (item) => switchBag(item),
        });
    };

    const handleSavePetPattern: React.MouseEventHandler<HTMLButtonElement> = (e) => {
        const target = e.currentTarget;
        const patternName = petGroups.map((v, index) => `方案${index}`);

        openMenu(target, {
            data: petGroups,
            displayText: patternName,
            handler: async (item, index) => {
                const pets = await getBagPets(PetPosition.bag1);
                petGroupsStorage.use((draft) => {
                    draft[index] = pets.map((pet) => pet.catchTime);
                });
                setPetGroups(petGroupsStorage.ref);
            },
        });
    };

    return (
        <>
            <h3>精灵背包</h3>
            <Button onClick={handleLowerBlood}>压血</Button>
            <Button onClick={handleCurePets}>治疗</Button>
            <Button onClick={handleCopyCatchTime}>复制catchTime</Button>
            <Button onClick={handleChangePetPattern}>更换方案</Button>
            <Button onClick={handleSavePetPattern}>保存方案</Button>
            <PopupMenu
                id="pet-bag-controller-menu"
                sx={{
                    '& .MuiPaper-root': {
                        bgcolor: `rgba(${mainColor.front} / 18%)`,
                        backdropFilter: 'blur(4px)',
                    },
                }}
                {...menuProps}
            />
            <PanelTableBase
                aria-label="pet list"
                size="small"
                heads={
                    <>
                        <TableCell align="center"></TableCell>
                        <TableCell align="center">id</TableCell>
                        <TableCell align="center"></TableCell>
                        <TableCell align="center">名称</TableCell>
                        <TableCell align="center">血量</TableCell>
                        <TableCell align="center">操作</TableCell>
                    </>
                }
            >
                {pets.map((row, index) => (
                    <PanelTableBodyRow key={row.catchTime}>
                        <TableCell align="center">
                            <Checkbox
                                color="primary"
                                checked={selected[index]}
                                onChange={(event) => {
                                    selected.splice(index, 1, event.target.checked);
                                    setSelected([...selected]);
                                }}
                            />
                        </TableCell>
                        <TableCell component="th" scope="row" align="center">
                            {row.id}
                        </TableCell>
                        <TableCell align="center">
                            <img crossOrigin="anonymous" src={petHeadSrc[index]} width={48}></img>
                        </TableCell>
                        <TableCell align="center">{row.name}</TableCell>
                        <TableCell align="center">
                            {row.hp} / {row.maxHp}
                        </TableCell>
                        <TableCell align="center">
                            <Button
                                onClick={() => {
                                    handleOpenPetItemUseProp(row.catchTime);
                                }}
                            >
                                道具
                            </Button>
                            <Button
                                onClick={() => {
                                    SAPet(row.catchTime).cure();
                                }}
                            >
                                治疗
                            </Button>
                        </TableCell>
                    </PanelTableBodyRow>
                ))}
            </PanelTableBase>
        </>
    );
}
