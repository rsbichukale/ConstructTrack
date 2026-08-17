'use client';

import React from 'react';
import { StepNavigator } from '../navigation/StepNavigator';
import { FloorSelector } from '../inspection/FloorSelector';
import { FlatSelector } from '../inspection/FlatSelector';
import { FloorPlanZones } from '../inspection/FloorPlanZones';
import { RoomInspector } from '../inspection/RoomInspector';
import { ElevatorGrid } from '../inspection/ElevatorGrid';

export const SupervisorFlow = ({
  currentStep,
  selectedFloor,
  selectedFlat,
  selectedRoomZone,
  activeWing,
  viewMode,
  onSelectStep,
  onSelectFloor,
  onSelectFlat,
  onSelectRoomZone,
  onSelectViewMode,
  onViewModeChange,
}) => {
  const handleViewModeChange = onSelectViewMode || onViewModeChange || (() => {});
  return (
    <div className="md:pl-72">
      <StepNavigator
        currentStep={currentStep}
        onSelectStep={onSelectStep}
        selectedWing={activeWing}
        selectedFloor={selectedFloor}
        selectedFlatNumber={selectedFlat ? selectedFlat.flatNumber : null}
        selectedRoomLabel={selectedRoomZone ? selectedRoomZone.zoneLabel : null}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {viewMode === 'drilldown' && (
          <>
            {currentStep === 2 && (
              <FloorSelector
                wing={activeWing}
                selectedFloor={selectedFloor}
                onSelectFloor={onSelectFloor}
              />
            )}

            {currentStep === 3 && selectedFloor && (
              <FlatSelector
                wing={activeWing}
                floorNumber={selectedFloor}
                selectedFlatId={selectedFlat?.id || null}
                onSelectFlat={onSelectFlat}
              />
            )}

            {currentStep === 4 && selectedFlat && (
              <FloorPlanZones
                flat={selectedFlat}
                selectedZoneId={selectedRoomZone?.id || null}
                onSelectZone={onSelectRoomZone}
              />
            )}

            {currentStep === 5 && selectedFlat && selectedRoomZone && (
              <RoomInspector
                flat={selectedFlat}
                roomZone={selectedRoomZone}
                onSelectFlat={onSelectFlat}
                onBackToZones={() => onSelectStep(4)}
              />
            )}
          </>
        )}

        {viewMode === 'elevatorGrid' && (
          <ElevatorGrid
            wing={activeWing}
            onSelectFlat={(flat) => {
              onSelectFlat(flat);
              handleViewModeChange('drilldown');
            }}
          />
        )}
      </main>
    </div>
  );
};
