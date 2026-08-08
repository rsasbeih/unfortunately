//the flow is:
//  idle
// ->composing (writing on paper)
// ->holding (holding the paper)
// ->throwing (paper is thrown and in mid air)
// -> landed (paper has landed and stopped moving)
// -> being_eaten (paper is being eaten by monster)
// -> idle (paper is minimized again)
export const PaperPhase = {
    IDLE: 'idle',
    COMPOSING: 'composing',
    HOLDING: 'holding',
    THROWING: 'throwing',
    LANDED: 'landed',
    BEING_EATEN: 'being_eaten'
}
