export const inProgress = ({ progress }) => progress > 0 && progress < 100
export const completed = ({ progress }) => progress === 100
