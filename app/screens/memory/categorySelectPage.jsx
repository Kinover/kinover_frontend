import React, {useState, useLayoutEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Platform,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import getResponsiveFontSize, {
  getResponsiveHeight,
  getResponsiveWidth,
} from '../../utils/responsive';
import CustomModal from '../../utils/customModal';
import CategoryModal from '../../utils/categoryModal';

export default function CategorySelectPage() {
  const navigation = useNavigation();
  const [categories, setCategories] = useState([
    '추억',
    '2019 중국 상하이 여행',
    '2020 할머니 칠순잔치',
    '2022 여의도 벚꽃 축제',
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View
          style={{
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text
            style={{fontSize: getResponsiveFontSize(20), textAlign: 'center'}}>
            카테고리 선택
          </Text>
        </View>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={() => {
            if (selectedCategory) {
              navigation.navigate('게시글작성화면', {selectedCategory});
            }
          }}
          style={{marginRight: 15}}>
          <Image
            source={require('../../assets/images/check-bt.png')}
            style={{
              width: 25,
              height: 25,
              resizeMode: 'contain',
              right: getResponsiveWidth(10),
            }}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation, selectedCategory]);

  const renderItem = ({item, index}) => (
    <TouchableOpacity
      onPress={() => {
        setSelectedIndex(index);
        setSelectedCategory(item);
      }}
      style={[
        styles.itemContainer,
        selectedIndex === index && styles.selectedItem,
      ]}>
      <Text style={styles.itemText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={categories}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListFooterComponent={
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setAddModalVisible(true)}>
            <Text style={styles.addText}>카테고리 추가</Text>
          </TouchableOpacity>
        }
      />
      <CategoryModal
        visible={addModalVisible}
        onClose={() => {
          setNewCategory('');
          setAddModalVisible(false);
        }}
        onConfirm={() => {
          if (newCategory.trim()) {
            const newList = [...categories, newCategory.trim()];
            setCategories(newList);
            setSelectedIndex(newList.length - 1);
            setSelectedCategory(newCategory.trim());
            setNewCategory('');
            setAddModalVisible(false);
          }
        }}
        content={
          <View style={{paddingHorizontal: 0}}>
            <Text
              style={{
                fontSize: getResponsiveFontSize(18),
                fontFamily: 'Pretendard-SemiBold',
                textAlign: 'center',
                marginBottom: getResponsiveHeight(15),
                marginTop: getResponsiveHeight(15),
              }}>
              새 카테고리를 입력해주세요
            </Text>
            <View
              style={{
                borderWidth: 1,
                borderColor: '#ddd',
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 8,
              }}>
              <TextInput
                placeholder="예: 2025 가족 여행"
                style={{
                  fontFamily: 'Pretendard-Regular',
                  fontSize: getResponsiveFontSize(14),
                }}
                value={newCategory}
                onChangeText={setNewCategory}
              />
            </View>
          </View>
        }></CategoryModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    borderTopWidth: 3,
    borderColor: '#D3D3D3',
  },
  itemContainer: {
    paddingVertical: 16,
    paddingHorizontal: getResponsiveWidth(20),
  },
  selectedItem: {
    backgroundColor: '#FFF3D2',
  },
  itemText: {
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Pretendard-Regular',
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginHorizontal: getResponsiveWidth(10),
  },
  addButton: {
    paddingVertical: 16,
    paddingHorizontal: getResponsiveWidth(20),
  },
  addText: {
    color: '#F8B500',
    fontSize: getResponsiveFontSize(14),
    fontFamily: 'Pretendard-Regular',
  },
});
