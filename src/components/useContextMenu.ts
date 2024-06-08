import {onMounted, onUnmounted, ref} from "vue";

export default function (containerRef: any) {
    const showMenu = ref(false);
    const x = ref(0);
    const y = ref(0);
    const handleContextMenu = (e: any) => {
        e.preventDefault();
        e.stopPropagation();
        showMenu.value = true;
        x.value = e.clientX;
        y.value = e.clientY;
    };

    function closeMenu() {
        showMenu.value = false;
    }

    onMounted(() => {
        const div = containerRef.value;
        div.addEventListener("contextmenu", handleContextMenu);
        window.addEventListener("click", closeMenu, true);
        window.addEventListener("contextmenu", closeMenu, true);
    });
    onUnmounted(() => {
        const div = containerRef.value;
        if (div) {
            div.removeEventListener("contextmenu", handleContextMenu);
        }
        window.removeEventListener("click", closeMenu, true);
        window.removeEventListener("contextmenu", closeMenu, true);
    });
    return {
        showMenu,
        x,
        y,
    };
}
