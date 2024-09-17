export default function depends(propertyNames, yupType, createType) {
  return (fromYupType) => {
    return yupType.when(propertyNames, (propertyValues, yupType) => {
      return fromYupType(createType(propertyValues, yupType));
    });
  };
}
