import { useNavigation, CommonActions } from "@react-navigation/native";

export const resetNavigationStack = (navigation, screen) => {
    navigation.dispatch(
        CommonActions.reset({
            index: 0,
            routes: [
                { name: screen }
            ],
        })
    );
}