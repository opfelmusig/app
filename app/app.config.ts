const menuActiveVariant = {
  true: {
    item: "text-default transition-colors before:transition-colors not-data-highlighted:before:bg-transparent data-highlighted:text-highlighted data-highlighted:before:bg-elevated/50",
    itemLeadingIcon: "text-dimmed transition-colors group-data-highlighted:text-default",
  },
};

export default defineAppConfig({
  ui: {
    colors: {
      neutral: "neutral",
      secondary: "purple",
    },
    button: {
      slots: {
        base: "select-none",
      },
    },
    modal: {
      slots: {
        footer: "justify-end",
      },
      variants: {
        fullscreen: {
          false: {
            content: "max-w-md rounded-xl",
          },
        },
      },
    },
    dropdownMenu: {
      slots: {
        content: "w-48 rounded-xl",
      },
      variants: {
        active: menuActiveVariant,
        size: {
          md: {
            item: "px-2.5",
            label: "px-2.5",
          },
        },
      },
    },
    contextMenu: {
      slots: {
        content: "w-48 rounded-xl",
      },
      variants: {
        active: menuActiveVariant,
        size: {
          md: {
            item: "px-2.5",
            label: "px-2.5",
          },
        },
      },
    },
    slider: {
      slots: {
        thumb: "size-0! opacity-0",
        range: "rounded-none",
        track: "bg-inverted/10",
      },
      defaultVariants: {
        color: "neutral",
      },
    },
  },
});
