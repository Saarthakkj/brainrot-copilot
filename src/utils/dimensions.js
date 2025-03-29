export const calculateDimensions = () => {
    const height = window.innerHeight * 0.7;
    const width = height * (9 / 19.5); // iPhone aspect ratio
    return { width, height };
};